const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let twitchToken = null;
let twitchTokenExpiry = 0;

async function getTwitchToken() {
  if (twitchToken && Date.now() < twitchTokenExpiry) return twitchToken;
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
  });
  const data = await res.json();
  twitchToken = data.access_token;
  twitchTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  return twitchToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Provide ?q=searchterm (min 2 chars)' });
  }

  const results = [];
  const promises = [];

  if (YOUTUBE_API_KEY) {
    promises.push(
      fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=5&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`)
        .then(r => r.json())
        .then(data => {
          if (!data.items) return;
          const ids = data.items.map(i => i.snippet.channelId).join(',');
          return fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${ids}&key=${YOUTUBE_API_KEY}`)
            .then(r => r.json())
            .then(chData => {
              for (const ch of (chData.items || [])) {
                results.push({
                  platform: 'youtube',
                  id: ch.id,
                  name: ch.snippet.title,
                  handle: ch.snippet.customUrl || '',
                  avatar: ch.snippet.thumbnails?.default?.url,
                  subscribers: parseInt(ch.statistics.subscriberCount) || 0,
                  totalViews: parseInt(ch.statistics.viewCount) || 0,
                });
              }
            });
        })
        .catch(() => {})
    );
  }

  if (TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET) {
    promises.push(
      (async () => {
        try {
          const token = await getTwitchToken();
          const data = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(q)}&first=5`, {
            headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` },
          }).then(r => r.json());

          for (const ch of (data.data || [])) {
            results.push({
              platform: 'twitch',
              id: ch.id,
              name: ch.display_name,
              handle: ch.broadcaster_login,
              avatar: ch.thumbnail_url,
              isLive: ch.is_live,
            });
          }
        } catch {}
      })()
    );
  }

  await Promise.all(promises);

  results.sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0));

  return res.json({ query: q, results: results.slice(0, 10) });
}
