const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const BASE = 'https://graph.facebook.com/v21.0';

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, username } = req.query;

  if (!INSTAGRAM_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Instagram API token not configured' });
  }

  try {
    if (q || username) {
      return await searchUser(q || username, res);
    } else {
      return res.status(400).json({ error: 'Provide ?q=username or ?username=handle' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function searchUser(query, res) {
  const cacheKey = `ig-${query}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const searchUrl = `${BASE}/ig_hashtag_search?q=${encodeURIComponent(query)}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  const userSearchUrl = `${BASE}/${query}?fields=business_discovery.fields(username,name,biography,profile_picture_url,followers_count,follows_count,media_count,media.limit(12){timestamp,like_count,comments_count,caption,media_type,media_url,thumbnail_url})&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  try {
    const userRes = await fetch(userSearchUrl);
    const userData = await userRes.json();

    if (userData.error) {
      const result = buildEstimatedProfile(query);
      setCache(cacheKey, result);
      return res.json(result);
    }

    const biz = userData.business_discovery;
    const recentMedia = biz.media?.data || [];

    let totalLikes = 0;
    let totalComments = 0;
    let reelsCount = 0;

    const posts = recentMedia.map(m => {
      totalLikes += m.like_count || 0;
      totalComments += m.comments_count || 0;
      if (m.media_type === 'VIDEO') reelsCount++;
      return {
        likes: m.like_count || 0,
        comments: m.comments_count || 0,
        type: m.media_type,
        timestamp: m.timestamp,
      };
    });

    const avgLikes = recentMedia.length > 0 ? Math.round(totalLikes / recentMedia.length) : 0;
    const engagementRate = biz.followers_count > 0
      ? ((totalLikes + totalComments) / recentMedia.length / biz.followers_count * 100).toFixed(2)
      : 0;

    const estimatedMonthlyReelsViews = avgLikes * 15 * reelsCount;
    const reelsRevenue = (estimatedMonthlyReelsViews / 1000) * 0.02;

    const result = {
      username: biz.username,
      name: biz.name,
      avatar: biz.profile_picture_url,
      bio: biz.biography,
      followers: biz.followers_count,
      following: biz.follows_count,
      mediaCount: biz.media_count,
      avgLikes,
      engagementRate: parseFloat(engagementRate),
      recentPosts: posts.slice(0, 6),
      estimates: {
        monthlyReelsViews: estimatedMonthlyReelsViews,
        monthlyRevenue: reelsRevenue,
        perViewEarning: 0.00002,
      },
      source: 'api',
    };

    setCache(cacheKey, result);
    return res.json(result);
  } catch {
    const result = buildEstimatedProfile(query);
    setCache(cacheKey, result);
    return res.json(result);
  }
}

function buildEstimatedProfile(username) {
  return {
    username,
    name: username,
    avatar: null,
    bio: '',
    followers: null,
    following: null,
    mediaCount: null,
    avgLikes: null,
    engagementRate: null,
    recentPosts: [],
    estimates: {
      monthlyReelsViews: null,
      monthlyRevenue: null,
      perViewEarning: 0.00002,
    },
    source: 'unavailable',
    message: 'Instagram data requires a business/creator account connection. Use the Earnings Calculator for estimates.',
  };
}
