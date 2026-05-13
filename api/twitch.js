const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const BASE = 'https://api.twitch.tv/helix';

let appToken = null;
let tokenExpiry = 0;

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

async function getAppToken() {
  if (appToken && Date.now() < tokenExpiry) return appToken;

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
  });
  const data = await res.json();
  appToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  return appToken;
}

async function twitchGet(endpoint) {
  const token = await getAppToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, userId, login } = req.query;

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Twitch API credentials not configured' });
  }

  try {
    if (q) {
      return await searchChannels(q, res);
    } else if (userId || login) {
      return await getChannelStats(userId, login, res);
    } else {
      return res.status(400).json({ error: 'Provide ?q=searchterm or ?login=username' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function searchChannels(query, res) {
  const cacheKey = `tw-search-${query}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const data = await twitchGet(`/search/channels?query=${encodeURIComponent(query)}&first=8`);

  const results = (data.data || []).map(ch => ({
    id: ch.id,
    name: ch.display_name,
    login: ch.broadcaster_login,
    avatar: ch.thumbnail_url,
    isLive: ch.is_live,
    gameId: ch.game_id,
    gameName: ch.game_name || '',
    title: ch.title || '',
  }));

  setCache(cacheKey, { results });
  return res.json({ results });
}

async function getChannelStats(userId, login, res) {
  const cacheKey = `tw-channel-${userId || login}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const param = userId ? `id=${userId}` : `login=${login}`;
  const userData = await twitchGet(`/users?${param}`);

  if (!userData.data || userData.data.length === 0) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const user = userData.data[0];

  const followData = await twitchGet(`/channels/followers?broadcaster_id=${user.id}&first=1`);
  const followers = followData.total || 0;

  let isLive = false;
  let streamData = {};
  const streamRes = await twitchGet(`/streams?user_id=${user.id}`);
  if (streamRes.data && streamRes.data.length > 0) {
    isLive = true;
    const s = streamRes.data[0];
    streamData = {
      title: s.title,
      gameName: s.game_name,
      viewerCount: s.viewer_count,
      startedAt: s.started_at,
      thumbnailUrl: s.thumbnail_url?.replace('{width}', '640').replace('{height}', '360'),
    };
  }

  const estimatedSubs = estimateSubscribers(followers);
  const subRevenue = estimatedSubs * 2.50;
  const estimatedAvgViewers = isLive ? streamData.viewerCount : Math.round(followers * 0.002);
  const estimatedHours = 120;
  const adRevenue = (estimatedAvgViewers * estimatedHours / 1000) * 3.50 * 0.55;

  const result = {
    id: user.id,
    name: user.display_name,
    login: user.login,
    avatar: user.profile_image_url,
    banner: user.offline_image_url,
    description: user.description,
    createdAt: user.created_at,
    broadcasterType: user.broadcaster_type,
    followers,
    isLive,
    stream: isLive ? streamData : null,
    estimates: {
      subscribers: estimatedSubs,
      avgViewers: estimatedAvgViewers,
      hoursPerMonth: estimatedHours,
      subRevenue,
      adRevenue,
      totalMonthlyRevenue: subRevenue + adRevenue,
      subTiers: [
        { name: 'Tier 1', price: 4.99, creatorCut: 2.50 },
        { name: 'Tier 2', price: 9.99, creatorCut: 5.00 },
        { name: 'Tier 3', price: 24.99, creatorCut: 12.50 },
      ],
    },
  };

  setCache(cacheKey, result);
  return res.json(result);
}

function estimateSubscribers(followers) {
  if (followers > 10000000) return Math.round(followers * 0.005);
  if (followers > 1000000) return Math.round(followers * 0.008);
  if (followers > 100000) return Math.round(followers * 0.01);
  if (followers > 10000) return Math.round(followers * 0.015);
  return Math.round(followers * 0.02);
}
