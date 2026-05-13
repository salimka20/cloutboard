import { creators, estimateEarnings, formatNumber, formatMoney, PLATFORM_RATES, generateTimeSeries } from './data.js';
import Chart from 'chart.js/auto';

// ===================== NAVIGATION =====================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-link[data-page]').forEach(l => {
    l.classList.toggle('active', l.dataset.page === pageId);
  });
  window.scrollTo(0, 0);
}

document.addEventListener('click', e => {
  const link = e.target.closest('[data-page]');
  if (link) {
    e.preventDefault();
    showPage(link.dataset.page);
  }
});

// ===================== SEARCH =====================
let searchTimeout = null;

function setupSearch(inputId, dropdownId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length < 2) {
      dropdown.classList.add('hidden');
      return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const localResults = creators.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) || c.handle.toLowerCase().includes(q.toLowerCase())
      );

      let apiResults = [];
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          apiResults = data.results || [];
        }
      } catch {}

      const seenNames = new Set();
      const combined = [];

      for (const c of localResults) {
        seenNames.add(c.name.toLowerCase());
        combined.push({ type: 'local', data: c });
      }
      for (const r of apiResults) {
        if (!seenNames.has(r.name.toLowerCase())) {
          seenNames.add(r.name.toLowerCase());
          combined.push({ type: 'api', data: r });
        }
      }

      if (combined.length === 0) {
        dropdown.innerHTML = '<div class="search-result"><span style="color:var(--text-muted)">No creators found</span></div>';
      } else {
        dropdown.innerHTML = combined.map(item => {
          if (item.type === 'local') {
            const c = item.data;
            const platformBadges = Object.keys(c.platforms).map(p => {
              const cls = p === 'twitter' ? 'x' : p === 'tiktok' ? 'tt' : p === 'youtube' ? 'yt' : p === 'twitch' ? 'tw' : p;
              return `<span class="mini-badge ${cls}">${platformLabel(p)}</span>`;
            }).join('');
            return `
              <div class="search-result" data-creator="${c.id}" data-type="local">
                <div class="search-result-avatar">${c.avatar}</div>
                <div class="search-result-info">
                  <div class="search-result-name">${c.name}</div>
                  <div class="search-result-platforms">${platformBadges}</div>
                </div>
              </div>`;
          } else {
            const r = item.data;
            const avatarHtml = r.avatar
              ? `<img src="${r.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />`
              : `<div class="search-result-avatar">${r.name.substring(0,2).toUpperCase()}</div>`;
            const badge = `<span class="mini-badge ${platformClass(r.platform)}">${platformLabel(r.platform)}</span>`;
            const subsText = r.subscribers ? `<span style="font-size:0.7rem;color:var(--text-muted);margin-left:8px;">${formatNumber(r.subscribers)} subs</span>` : '';
            return `
              <div class="search-result" data-api-id="${r.id}" data-api-platform="${r.platform}" data-type="api">
                ${avatarHtml}
                <div class="search-result-info">
                  <div class="search-result-name">${r.name}${subsText}</div>
                  <div class="search-result-platforms">${badge}${r.isLive ? '<span class="mini-badge" style="background:rgba(255,0,0,0.2);color:#ff4444;">LIVE</span>' : ''}</div>
                </div>
              </div>`;
          }
        }).join('');
      }

      dropdown.classList.remove('hidden');

      dropdown.querySelectorAll('.search-result[data-type="local"]').forEach(el => {
        el.addEventListener('click', () => {
          openProfile(el.dataset.creator);
          dropdown.classList.add('hidden');
          input.value = '';
        });
      });
      dropdown.querySelectorAll('.search-result[data-type="api"]').forEach(el => {
        el.addEventListener('click', () => {
          openApiProfile(el.dataset.apiPlatform, el.dataset.apiId);
          dropdown.classList.add('hidden');
          input.value = '';
        });
      });
    }, 300);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

setupSearch('hero-search-input', 'hero-search-dropdown');
setupSearch('nav-search-input', 'nav-search-dropdown');

function platformLabel(p) {
  const map = { youtube: 'YT', twitch: 'Twitch', kick: 'Kick', tiktok: 'TikTok', twitter: 'X', instagram: 'IG' };
  return map[p] || p;
}

function platformColor(p) {
  const map = {
    youtube: 'var(--yt-red)', twitch: 'var(--tw-purple)', kick: 'var(--kick-green)',
    tiktok: 'var(--tt-pink)', twitter: 'var(--x-white)', instagram: '#e1306c'
  };
  return map[p] || 'var(--accent)';
}

function platformClass(p) {
  const map = { youtube: 'yt', twitch: 'tw', kick: 'kick', tiktok: 'tt', twitter: 'x', instagram: 'ig' };
  return map[p] || p;
}

// ===================== TRENDING GRID =====================
function renderTrending() {
  const grid = document.getElementById('trending-grid');
  if (!grid) return;

  grid.innerHTML = creators.slice(0, 8).map(c => {
    const earnings = estimateEarnings(c);
    const totalFollowers = Object.entries(c.platforms).reduce((sum, [key, val]) => {
      return sum + (val.subscribers || val.followers || 0);
    }, 0);
    const platformBadges = Object.keys(c.platforms).map(p =>
      `<span class="mini-badge ${platformClass(p)}">${platformLabel(p)}</span>`
    ).join('');

    return `
      <div class="creator-card" data-creator="${c.id}">
        <div class="creator-card-header">
          <div class="creator-avatar">${c.avatar}</div>
          <div>
            <div class="creator-name">${c.name}</div>
            <div class="creator-handle">${c.handle}</div>
          </div>
        </div>
        <div class="creator-card-platforms">${platformBadges}</div>
        <div class="creator-card-stats">
          <div class="mini-stat">
            <div class="mini-stat-label">Total Following</div>
            <div class="mini-stat-value">${formatNumber(totalFollowers)}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">Est. Monthly</div>
            <div class="mini-stat-value" style="color:var(--neon-green)">${formatMoney(earnings.total)}</div>
          </div>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.creator-card').forEach(card => {
    card.addEventListener('click', () => openProfile(card.dataset.creator));
  });
}

// ===================== TOP EARNERS TABLE =====================
function renderTopEarners() {
  const table = document.getElementById('top-earners');
  if (!table) return;

  const ranked = creators.map(c => ({ ...c, earnings: estimateEarnings(c) }))
    .sort((a, b) => b.earnings.total - a.earnings.total)
    .slice(0, 10);

  table.innerHTML = ranked.map((c, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const mainPlatform = Object.keys(c.platforms)[0];
    const totalFollowers = Object.entries(c.platforms).reduce((sum, [, val]) => {
      return sum + (val.subscribers || val.followers || 0);
    }, 0);

    return `
      <div class="earner-row" data-creator="${c.id}">
        <div class="earner-rank ${rankClass}">#${i + 1}</div>
        <div class="earner-info">
          <div class="earner-avatar">${c.avatar}</div>
          <div class="earner-name">${c.name}</div>
        </div>
        <div class="earner-subs">${formatNumber(totalFollowers)} followers</div>
        <div class="earner-earnings">${formatMoney(c.earnings.total)}/mo</div>
        <div class="earner-platform">
          <span class="mini-badge ${platformClass(mainPlatform)}">${platformLabel(mainPlatform)}</span>
        </div>
      </div>`;
  }).join('');

  table.querySelectorAll('.earner-row').forEach(row => {
    row.addEventListener('click', () => openProfile(row.dataset.creator));
  });
}

// ===================== CREATOR PROFILE =====================
let activeCharts = [];

function destroyCharts() {
  activeCharts.forEach(c => c.destroy());
  activeCharts = [];
}

function openProfile(creatorId) {
  const creator = creators.find(c => c.id === creatorId);
  if (!creator) return;
  destroyCharts();
  showPage('profile');
  renderProfile(creator);
}

async function openApiProfile(platform, id) {
  destroyCharts();
  showPage('profile');
  const container = document.getElementById('profile-content');
  container.innerHTML = `
    <div style="text-align:center;padding:80px 24px;">
      <div class="profile-avatar" style="margin:0 auto 20px;animation:pulse-dot 1s infinite;">...</div>
      <p style="color:var(--text-secondary);">Loading live data...</p>
    </div>`;

  try {
    if (platform === 'youtube') {
      const res = await fetch(`/api/youtube?channelId=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      renderApiYoutubeProfile(data);
    } else if (platform === 'twitch') {
      const res = await fetch(`/api/twitch?userId=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      renderApiTwitchProfile(data);
    }
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center;padding:80px 24px;">
        <p style="color:var(--neon-pink);">Failed to load: ${err.message}</p>
        <p style="color:var(--text-muted);margin-top:8px;">The API may not be configured yet. Try a creator from the homepage.</p>
      </div>`;
  }
}

function renderApiYoutubeProfile(data) {
  const container = document.getElementById('profile-content');
  const avatarHtml = data.avatar
    ? `<img src="${data.avatar}" style="width:100px;height:100px;border-radius:50%;border:3px solid var(--accent);box-shadow:0 0 30px var(--accent-glow);" />`
    : `<div class="profile-avatar">${data.name.substring(0,2).toUpperCase()}</div>`;

  const lf = data.longform;
  const sh = data.shorts;

  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-top">
        ${avatarHtml}
        <div class="profile-info">
          <h1>${data.name}</h1>
          <div class="profile-handle">${data.handle || ''}</div>
          <div class="profile-badges">
            <span class="platform-badge yt" style="font-size:0.75rem;padding:4px 12px;">YouTube</span>
            ${data.country !== 'Unknown' ? `<span class="platform-badge" style="font-size:0.75rem;padding:4px 12px;">${data.country}</span>` : ''}
            <span style="font-size:0.75rem;color:var(--neon-green);padding:4px 8px;">LIVE DATA</span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Subscribers</div>
          <div class="stat-value live" id="live-api-subs">${formatNumber(data.subscribers)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Views</div>
          <div class="stat-value live" id="live-api-views">${formatNumber(data.totalViews)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Videos</div>
          <div class="stat-value">${data.videoCount.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Est. Monthly Revenue</div>
          <div class="stat-value" style="color:var(--neon-green)">${formatMoney(data.estimatedMonthlyRevenue)}</div>
        </div>
      </div>

      <h3 style="margin:24px 0 16px;font-size:1.2rem;">YouTube Revenue Breakdown: Long-form vs Shorts</h3>

      <div class="yt-split">
        <div class="yt-split-card longform">
          <div class="yt-split-title">Long-form Content <span class="tag lf-tag">Videos</span></div>
          <div class="yt-split-stats">
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Recent Views (50 videos)</span>
              <span class="yt-split-stat-value">${formatNumber(lf.recentViews)}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Long-form Videos Found</span>
              <span class="yt-split-stat-value">${lf.count}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Avg Views / Video</span>
              <span class="yt-split-stat-value">${formatNumber(lf.avgViews)}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Estimated CPM</span>
              <span class="yt-split-stat-value">$${lf.cpm.toFixed(2)}</span>
            </div>
            <div class="yt-split-stat" style="border-top:1px solid var(--border);padding-top:10px;margin-top:6px;">
              <span class="yt-split-stat-label" style="font-weight:700;color:var(--text-primary);">Est. Monthly Revenue</span>
              <span class="yt-split-stat-value" style="color:var(--neon-green);font-size:1.3rem;">${formatMoney(lf.monthlyRevenue)}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Per View Earnings</span>
              <span class="yt-split-stat-value" style="color:var(--neon-green)">$${lf.perViewEarning.toFixed(5)}</span>
            </div>
          </div>
        </div>

        <div class="yt-split-card shorts">
          <div class="yt-split-title">Shorts <span class="tag sh-tag">Short-form</span></div>
          <div class="yt-split-stats">
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Recent Views (50 videos)</span>
              <span class="yt-split-stat-value">${formatNumber(sh.recentViews)}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Shorts Found</span>
              <span class="yt-split-stat-value">${sh.count}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Avg Views / Short</span>
              <span class="yt-split-stat-value">${formatNumber(sh.avgViews)}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">RPM (per 1K)</span>
              <span class="yt-split-stat-value">$${sh.rpm.toFixed(2)}</span>
            </div>
            <div class="yt-split-stat" style="border-top:1px solid var(--border);padding-top:10px;margin-top:6px;">
              <span class="yt-split-stat-label" style="font-weight:700;color:var(--text-primary);">Est. Monthly Revenue</span>
              <span class="yt-split-stat-value" style="color:var(--neon-orange);font-size:1.3rem;">${formatMoney(sh.monthlyRevenue)}</span>
            </div>
            <div class="yt-split-stat">
              <span class="yt-split-stat-label">Per View Earnings</span>
              <span class="yt-split-stat-value" style="color:var(--neon-orange)">$${sh.perViewEarning.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ad-slot"><div class="ad-placeholder">Advertisement</div></div>

      ${data.recentVideos && data.recentVideos.length > 0 ? `
        <h3 style="margin:24px 0 16px;">Recent Videos</h3>
        <div style="display:grid;gap:8px;">
          ${data.recentVideos.map(v => `
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
              <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
                  ${v.isShort ? '<span class="tag sh-tag" style="font-size:0.6rem;padding:1px 6px;">SHORT</span>' : '<span class="tag lf-tag" style="font-size:0.6rem;padding:1px 6px;">VIDEO</span>'}
                  ${new Date(v.publishedAt).toLocaleDateString()}
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;margin-left:16px;">
                <div style="font-family:var(--font-mono);font-weight:700;">${formatNumber(v.views)}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">${formatNumber(v.likes)} likes</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  startLiveCounter('live-api-subs', data.subscribers);
  startLiveCounter('live-api-views', data.totalViews);
}

function renderApiTwitchProfile(data) {
  const container = document.getElementById('profile-content');
  const avatarHtml = data.avatar
    ? `<img src="${data.avatar}" style="width:100px;height:100px;border-radius:50%;border:3px solid var(--tw-purple);box-shadow:0 0 30px rgba(145,70,255,0.3);" />`
    : `<div class="profile-avatar">${data.name.substring(0,2).toUpperCase()}</div>`;

  const est = data.estimates;

  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-top">
        ${avatarHtml}
        <div class="profile-info">
          <h1>${data.name}</h1>
          <div class="profile-handle">@${data.login}</div>
          <div class="profile-badges">
            <span class="platform-badge tw" style="font-size:0.75rem;padding:4px 12px;">Twitch</span>
            ${data.broadcasterType ? `<span class="platform-badge" style="font-size:0.75rem;padding:4px 12px;">${data.broadcasterType}</span>` : ''}
            ${data.isLive ? '<span style="font-size:0.75rem;color:#ff4444;padding:4px 8px;background:rgba(255,0,0,0.15);border-radius:4px;">LIVE NOW</span>' : ''}
            <span style="font-size:0.75rem;color:var(--neon-green);padding:4px 8px;">LIVE DATA</span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Followers</div>
          <div class="stat-value live" id="live-tw-api-fol">${formatNumber(data.followers)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Est. Subscribers</div>
          <div class="stat-value" style="color:var(--tw-purple)">${formatNumber(est.subscribers)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${data.isLive ? 'Current Viewers' : 'Est. Avg Viewers'}</div>
          <div class="stat-value">${formatNumber(data.isLive ? data.stream.viewerCount : est.avgViewers)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Account Created</div>
          <div class="stat-value" style="font-size:1rem;">${new Date(data.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      ${data.isLive ? `
        <div class="detail-card" style="margin:24px 0;border-color:rgba(255,0,0,0.3);background:linear-gradient(135deg,rgba(255,0,0,0.05),var(--bg-card));">
          <h3 style="color:#ff4444;">Currently Live</h3>
          <p><strong>${data.stream.title}</strong></p>
          <p style="color:var(--text-muted);">Playing: ${data.stream.gameName} | ${formatNumber(data.stream.viewerCount)} viewers</p>
        </div>
      ` : ''}

      ${data.description ? `<p style="color:var(--text-secondary);margin:16px 0;max-width:600px;">${data.description}</p>` : ''}

      <h3 style="margin:24px 0 16px;">Estimated Earnings</h3>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Sub Revenue / Month</div>
          <div class="stat-value" style="color:var(--neon-green)">${formatMoney(est.subRevenue)}</div>
          <div class="stat-change">50/50 split @ $${est.subTiers[0].creatorCut}/sub</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ad Revenue / Month</div>
          <div class="stat-value" style="color:var(--neon-green)">${formatMoney(est.adRevenue)}</div>
          <div class="stat-change">$3.50 CPM x 55% cut</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Monthly Rev</div>
          <div class="stat-value" style="color:var(--neon-green)">${formatMoney(est.totalMonthlyRevenue)}</div>
        </div>
      </div>

      <h3 style="margin:24px 0 16px;">Subscription Tiers</h3>
      <div class="stats-row">
        ${est.subTiers.map(t => `
          <div class="stat-card">
            <div class="stat-label">${t.name}</div>
            <div class="stat-value">$${t.price}</div>
            <div class="stat-change">Creator gets $${t.creatorCut.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  startLiveCounter('live-tw-api-fol', data.followers);
}

function renderProfile(creator) {
  const container = document.getElementById('profile-content');
  const earnings = estimateEarnings(creator);
  const platformKeys = Object.keys(creator.platforms);

  const platformBadges = platformKeys.map(p =>
    `<span class="platform-badge ${platformClass(p)}" style="font-size:0.75rem;padding:4px 12px;">
      ${platformLabel(p)}
    </span>`
  ).join('');

  const platformTabs = [
    '<div class="profile-tab active" data-platform="overview"><span>Overview</span></div>',
    ...platformKeys.map(p => `
      <div class="profile-tab" data-platform="${p}">
        <span>${platformLabel(p) === 'YT' ? 'YouTube' : platformLabel(p) === 'X' ? 'X / Twitter' : platformLabel(p) === 'IG' ? 'Instagram' : platformLabel(p)}</span>
      </div>
    `)
  ].join('');

  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-top">
        <div class="profile-avatar">${creator.avatar}</div>
        <div class="profile-info">
          <h1>${creator.name}</h1>
          <div class="profile-handle">${creator.handle}</div>
          <div class="profile-badges">${platformBadges}</div>
        </div>
      </div>
    </div>
    <div class="profile-tabs">${platformTabs}</div>
    <div class="profile-stats" id="profile-panel"></div>
  `;

  const tabs = container.querySelectorAll('.profile-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      destroyCharts();
      renderPlatformPanel(creator, tab.dataset.platform);
    });
  });

  renderPlatformPanel(creator, 'overview');
}

function renderPlatformPanel(creator, platform) {
  const panel = document.getElementById('profile-panel');
  if (platform === 'overview') {
    renderOverviewPanel(creator, panel);
  } else if (platform === 'youtube') {
    renderYoutubePanel(creator, panel);
  } else if (platform === 'twitch') {
    renderTwitchPanel(creator, panel);
  } else if (platform === 'kick') {
    renderKickPanel(creator, panel);
  } else if (platform === 'tiktok') {
    renderTiktokPanel(creator, panel);
  } else if (platform === 'twitter') {
    renderTwitterPanel(creator, panel);
  } else if (platform === 'instagram') {
    renderInstagramPanel(creator, panel);
  }
}

function renderOverviewPanel(creator, panel) {
  const earnings = estimateEarnings(creator);
  const platformKeys = Object.keys(creator.platforms);

  const totalFollowers = Object.entries(creator.platforms).reduce((sum, [, val]) => {
    return sum + (val.subscribers || val.followers || 0);
  }, 0);

  const overviewStats = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Total Following</div>
        <div class="stat-value live" id="live-followers">${formatNumber(totalFollowers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Est. Monthly Earnings</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(earnings.total)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Est. Yearly Earnings</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(earnings.total * 12)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Platforms</div>
        <div class="stat-value">${platformKeys.length}</div>
      </div>
    </div>
  `;

  const earningsByPlatform = platformKeys.map(p => {
    const rev = earnings.breakdown[p];
    if (!rev) return '';
    return `
      <div class="stat-card">
        <div class="stat-label" style="color:${platformColor(p)}">${platformLabel(p) === 'YT' ? 'YouTube' : platformLabel(p) === 'X' ? 'X / Twitter' : platformLabel(p) === 'IG' ? 'Instagram' : platformLabel(p)}</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(rev.total)}<span style="font-size:0.7rem;color:var(--text-muted)">/mo</span></div>
      </div>
    `;
  }).join('');

  panel.innerHTML = `
    ${overviewStats}
    <h3 style="margin-bottom:16px;font-size:1.1rem;">Earnings by Platform</h3>
    <div class="stats-row">${earningsByPlatform}</div>
    <div class="ad-slot" data-ad="profile-ad"><div class="ad-placeholder">Advertisement</div></div>
    <div class="chart-container">
      <h3>Estimated Monthly Earnings by Platform</h3>
      <div class="chart-wrap"><canvas id="chart-earnings"></canvas></div>
    </div>
  `;

  renderEarningsChart(creator);
  startLiveCounter('live-followers', totalFollowers);
}

function renderYoutubePanel(creator, panel) {
  const yt = creator.platforms.youtube;
  if (!yt) { panel.innerHTML = '<p style="color:var(--text-muted);padding:40px;">Not on YouTube</p>'; return; }

  const earnings = estimateEarnings(creator);
  const ytEarnings = earnings.breakdown.youtube;

  panel.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Subscribers</div>
        <div class="stat-value live" id="live-yt-subs">${formatNumber(yt.subscribers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Views</div>
        <div class="stat-value live" id="live-yt-views">${formatNumber(yt.totalViews)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Revenue (Total)</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(ytEarnings.total)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Yearly Revenue (Est.)</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(ytEarnings.total * 12)}</div>
      </div>
    </div>

    <h3 style="margin:24px 0 16px;font-size:1.2rem;">YouTube Revenue Breakdown: Long-form vs Shorts</h3>

    <div class="yt-split">
      <div class="yt-split-card longform">
        <div class="yt-split-title">
          Long-form Content <span class="tag lf-tag">Videos</span>
        </div>
        <div class="yt-split-stats">
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Monthly Views</span>
            <span class="yt-split-stat-value">${formatNumber(yt.longform.monthlyViews)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Total Views</span>
            <span class="yt-split-stat-value">${formatNumber(yt.longform.totalViews)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Avg Views / Video</span>
            <span class="yt-split-stat-value">${formatNumber(yt.longform.avgViewsPerVideo)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Total Videos</span>
            <span class="yt-split-stat-value">${yt.longform.videos.toLocaleString()}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">CPM</span>
            <span class="yt-split-stat-value">$${yt.longform.cpm.toFixed(2)}</span>
          </div>
          <div class="yt-split-stat" style="border-top:1px solid var(--border);padding-top:10px;margin-top:6px;">
            <span class="yt-split-stat-label" style="font-weight:700;color:var(--text-primary);">Monthly Revenue</span>
            <span class="yt-split-stat-value" style="color:var(--neon-green);font-size:1.3rem;">${formatMoney(ytEarnings.longform)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Per View Earnings</span>
            <span class="yt-split-stat-value" style="color:var(--neon-green)">$${(yt.longform.cpm / 1000).toFixed(5)}</span>
          </div>
        </div>
      </div>

      <div class="yt-split-card shorts">
        <div class="yt-split-title">
          Shorts <span class="tag sh-tag">Short-form</span>
        </div>
        <div class="yt-split-stats">
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Monthly Views</span>
            <span class="yt-split-stat-value">${formatNumber(yt.shorts.monthlyViews)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Total Views</span>
            <span class="yt-split-stat-value">${formatNumber(yt.shorts.totalViews)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Avg Views / Short</span>
            <span class="yt-split-stat-value">${formatNumber(yt.shorts.avgViewsPerVideo)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Total Shorts</span>
            <span class="yt-split-stat-value">${yt.shorts.videos.toLocaleString()}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">RPM (per 1K)</span>
            <span class="yt-split-stat-value">$${yt.shorts.rpm.toFixed(2)}</span>
          </div>
          <div class="yt-split-stat" style="border-top:1px solid var(--border);padding-top:10px;margin-top:6px;">
            <span class="yt-split-stat-label" style="font-weight:700;color:var(--text-primary);">Monthly Revenue</span>
            <span class="yt-split-stat-value" style="color:var(--neon-orange);font-size:1.3rem;">${formatMoney(ytEarnings.shorts)}</span>
          </div>
          <div class="yt-split-stat">
            <span class="yt-split-stat-label">Per View Earnings</span>
            <span class="yt-split-stat-value" style="color:var(--neon-orange)">$${(yt.shorts.rpm / 1000).toFixed(6)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ad-slot" data-ad="yt-profile-ad"><div class="ad-placeholder">Advertisement</div></div>

    <div class="chart-container">
      <h3>Long-form vs Shorts Revenue Comparison</h3>
      <div class="chart-wrap"><canvas id="chart-yt-split"></canvas></div>
    </div>

    <div class="chart-container">
      <h3>Monthly Views Trend (Simulated)</h3>
      <div class="time-selector">
        <button class="time-btn active" data-days="7">7D</button>
        <button class="time-btn" data-days="30">30D</button>
        <button class="time-btn" data-days="90">3M</button>
        <button class="time-btn" data-days="365">1Y</button>
      </div>
      <div class="chart-wrap"><canvas id="chart-yt-views"></canvas></div>
    </div>
  `;

  renderYoutubeCharts(yt, ytEarnings);
  startLiveCounter('live-yt-subs', yt.subscribers);
  startLiveCounter('live-yt-views', yt.totalViews);

  panel.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      destroyCharts();
      renderYoutubeCharts(yt, ytEarnings, parseInt(btn.dataset.days));
    });
  });
}

function renderTwitchPanel(creator, panel) {
  const tw = creator.platforms.twitch;
  if (!tw) { panel.innerHTML = '<p style="color:var(--text-muted);padding:40px;">Not on Twitch</p>'; return; }
  const earnings = estimateEarnings(creator);
  const twEarnings = earnings.breakdown.twitch;

  panel.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Followers</div>
        <div class="stat-value live" id="live-tw-fol">${formatNumber(tw.followers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Subscribers</div>
        <div class="stat-value" style="color:var(--tw-purple)">${formatNumber(tw.subscribers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Viewers</div>
        <div class="stat-value">${formatNumber(tw.avgViewers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Peak Viewers</div>
        <div class="stat-value">${formatNumber(tw.peakViewers)}</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Hours Streamed / Month</div>
        <div class="stat-value">${tw.hoursStreamed}h</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sub Revenue / Month</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(twEarnings.subs)}</div>
        <div class="stat-change">50/50 split @ $${PLATFORM_RATES.twitch.tiers[0].creatorCut}/sub</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ad Revenue / Month</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(twEarnings.ads)}</div>
        <div class="stat-change">$${PLATFORM_RATES.twitch.adCpm} CPM × 55% cut</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Monthly Rev</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(twEarnings.total)}</div>
      </div>
    </div>
    <h3 style="margin:16px 0;">Subscription Tiers</h3>
    <div class="stats-row">
      ${PLATFORM_RATES.twitch.tiers.map(t => `
        <div class="stat-card">
          <div class="stat-label">${t.name}</div>
          <div class="stat-value">$${t.price}</div>
          <div class="stat-change">Creator gets $${t.creatorCut.toFixed(2)}</div>
        </div>
      `).join('')}
    </div>
  `;
  startLiveCounter('live-tw-fol', tw.followers);
}

function renderKickPanel(creator, panel) {
  const ki = creator.platforms.kick;
  if (!ki) { panel.innerHTML = '<p style="color:var(--text-muted);padding:40px;">Not on Kick</p>'; return; }
  const earnings = estimateEarnings(creator);
  const kiEarnings = earnings.breakdown.kick;

  panel.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Followers</div>
        <div class="stat-value live" id="live-ki-fol">${formatNumber(ki.followers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Subscribers</div>
        <div class="stat-value" style="color:var(--kick-green)">${formatNumber(ki.subscribers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sub Revenue / Month</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(kiEarnings.subs)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Per Sub Earnings</div>
        <div class="stat-value" style="color:var(--kick-green)">$${PLATFORM_RATES.kick.creatorCutAmount}</div>
        <div class="stat-change up">95/5 split — creator-first</div>
      </div>
    </div>
    <div class="detail-card" style="margin-top:24px;">
      <h3>Kick Subscription Model</h3>
      <p>Kick offers a single subscription tier at <strong>$4.99/month</strong>. The platform takes only a <strong>5% cut</strong>, meaning creators keep <strong>$4.74 per subscriber</strong>. That's nearly double what Twitch's standard split offers. Tips go directly to the creator with no platform fee.</p>
    </div>
  `;
  startLiveCounter('live-ki-fol', ki.followers);
}

function renderTiktokPanel(creator, panel) {
  const tt = creator.platforms.tiktok;
  if (!tt) { panel.innerHTML = '<p style="color:var(--text-muted);padding:40px;">Not on TikTok</p>'; return; }
  const earnings = estimateEarnings(creator);
  const ttEarnings = earnings.breakdown.tiktok;

  panel.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Followers</div>
        <div class="stat-value live" id="live-tt-fol">${formatNumber(tt.followers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Views</div>
        <div class="stat-value live" id="live-tt-views">${formatNumber(tt.monthlyViews)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Likes</div>
        <div class="stat-value">${formatNumber(tt.monthlyLikes)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Likes</div>
        <div class="stat-value">${formatNumber(tt.totalLikes)}</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Total Videos</div>
        <div class="stat-value">${tt.videos.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Est. Monthly Revenue</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(ttEarnings.total)}</div>
        <div class="stat-change">Creator Fund: $0.02–$0.05 per 1K views</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Per View Earnings</div>
        <div class="stat-value" style="color:var(--neon-green)">$${(PLATFORM_RATES.tiktok.rpmAvg / 1000).toFixed(6)}</div>
      </div>
    </div>
  `;
  startLiveCounter('live-tt-fol', tt.followers);
  startLiveCounter('live-tt-views', tt.monthlyViews);
}

function renderTwitterPanel(creator, panel) {
  const x = creator.platforms.twitter;
  if (!x) { panel.innerHTML = '<p style="color:var(--text-muted);padding:40px;">Not on X / Twitter</p>'; return; }
  const earnings = estimateEarnings(creator);
  const xEarnings = earnings.breakdown.twitter;

  panel.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Followers</div>
        <div class="stat-value live" id="live-x-fol">${formatNumber(x.followers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Impressions</div>
        <div class="stat-value">${formatNumber(x.monthlyImpressions)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Likes</div>
        <div class="stat-value">${formatNumber(x.monthlyLikes)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Posts</div>
        <div class="stat-value">${x.totalTweets.toLocaleString()}</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Est. Monthly Ad Rev Share</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(xEarnings.total)}</div>
        <div class="stat-change">X Premium creators: ~$0.10–$0.30 per 1K impressions</div>
      </div>
    </div>
  `;
  startLiveCounter('live-x-fol', x.followers);
}

function renderInstagramPanel(creator, panel) {
  const ig = creator.platforms.instagram;
  if (!ig) { panel.innerHTML = '<p style="color:var(--text-muted);padding:40px;">Not on Instagram</p>'; return; }
  const earnings = estimateEarnings(creator);
  const igEarnings = earnings.breakdown.instagram;

  panel.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Followers</div>
        <div class="stat-value live" id="live-ig-fol">${formatNumber(ig.followers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Reels Views</div>
        <div class="stat-value">${formatNumber(ig.monthlyReelsViews)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Likes</div>
        <div class="stat-value">${formatNumber(ig.monthlyLikes)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Posts</div>
        <div class="stat-value">${ig.posts.toLocaleString()}</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Est. Monthly Reels Revenue</div>
        <div class="stat-value" style="color:var(--neon-green)">${formatMoney(igEarnings.total)}</div>
        <div class="stat-change">Reels Bonus: $0.01–$0.03 per 1K views (invite-only)</div>
      </div>
    </div>
  `;
  startLiveCounter('live-ig-fol', ig.followers);
}

// ===================== CHARTS =====================
function renderEarningsChart(creator) {
  const earnings = estimateEarnings(creator);
  const platforms = Object.keys(earnings.breakdown);
  const labels = platforms.map(p => platformLabel(p) === 'YT' ? 'YouTube' : platformLabel(p) === 'X' ? 'X/Twitter' : platformLabel(p) === 'IG' ? 'Instagram' : platformLabel(p));
  const data = platforms.map(p => earnings.breakdown[p].total);
  const colors = platforms.map(p => platformColor(p).replace('var(--yt-red)', '#ff0033').replace('var(--tw-purple)', '#9146ff').replace('var(--kick-green)', '#53fc18').replace('var(--tt-pink)', '#ff0050').replace('var(--x-white)', '#e7e9ea').replace('#e1306c', '#e1306c'));

  const ctx = document.getElementById('chart-earnings');
  if (!ctx) return;

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + '44'),
        borderColor: colors,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#8888aa', font: { family: 'Inter' } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatMoney(ctx.raw)}/mo`
          }
        }
      },
    },
  });
  activeCharts.push(chart);
}

function renderYoutubeCharts(yt, ytEarnings, days = 30) {
  const ctx1 = document.getElementById('chart-yt-split');
  if (ctx1) {
    const chart1 = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Monthly Views', 'Monthly Revenue'],
        datasets: [
          {
            label: 'Long-form',
            data: [yt.longform.monthlyViews, ytEarnings.longform],
            backgroundColor: 'rgba(255,0,51,0.3)',
            borderColor: '#ff0033',
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Shorts',
            data: [yt.shorts.monthlyViews, ytEarnings.shorts],
            backgroundColor: 'rgba(255,136,0,0.3)',
            borderColor: '#ff8800',
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8888aa', font: { family: 'Inter' } } },
          tooltip: {
            callbacks: {
              label: ctx => {
                if (ctx.dataIndex === 1) return `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`;
                return `${ctx.dataset.label}: ${formatNumber(ctx.raw)} views`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: '#1e1e3a' }, ticks: { color: '#8888aa' } },
          y: { grid: { color: '#1e1e3a' }, ticks: { color: '#8888aa', callback: v => formatNumber(v) } },
        },
      },
    });
    activeCharts.push(chart1);
  }

  const ctx2 = document.getElementById('chart-yt-views');
  if (ctx2) {
    const lfData = generateTimeSeries(yt.longform.monthlyViews / days, days, 0.2);
    const shData = generateTimeSeries(yt.shorts.monthlyViews / days, days, 0.25);
    const labels = Array.from({ length: days }, (_, i) => {
      if (days <= 7) return `Day ${i + 1}`;
      if (days <= 30) return `${i + 1}`;
      if (days <= 90) return i % 7 === 0 ? `W${Math.floor(i / 7) + 1}` : '';
      return i % 30 === 0 ? `M${Math.floor(i / 30) + 1}` : '';
    });

    const chart2 = new Chart(ctx2, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Long-form Views / Day',
            data: lfData,
            borderColor: '#ff0033',
            backgroundColor: 'rgba(255,0,51,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: days > 30 ? 0 : 3,
          },
          {
            label: 'Shorts Views / Day',
            data: shData,
            borderColor: '#ff8800',
            backgroundColor: 'rgba(255,136,0,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: days > 30 ? 0 : 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8888aa', font: { family: 'Inter' } } },
          tooltip: {
            callbacks: { label: ctx => `${ctx.dataset.label}: ${formatNumber(ctx.raw)}` }
          }
        },
        scales: {
          x: { grid: { color: '#1e1e3a' }, ticks: { color: '#8888aa', maxRotation: 0 } },
          y: { grid: { color: '#1e1e3a' }, ticks: { color: '#8888aa', callback: v => formatNumber(v) } },
        },
      },
    });
    activeCharts.push(chart2);
  }
}

// ===================== LIVE COUNTERS =====================
const liveIntervals = [];

function startLiveCounter(elementId, baseValue) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current = baseValue;
  const interval = setInterval(() => {
    const increment = Math.floor(Math.random() * Math.max(1, Math.floor(baseValue * 0.0000005)));
    current += increment;
    el.textContent = formatNumber(current);
  }, 2000 + Math.random() * 3000);

  liveIntervals.push(interval);
}

// ===================== COMPARE CALCULATOR =====================
function updateCompareCalc() {
  const subs = parseInt(document.getElementById('calc-subs')?.value) || 0;
  const viewers = parseInt(document.getElementById('calc-viewers')?.value) || 0;
  const hours = parseInt(document.getElementById('calc-hours')?.value) || 0;

  const twSubs = subs * PLATFORM_RATES.twitch.tiers[0].creatorCut;
  const twAds = (viewers * hours / 1000) * PLATFORM_RATES.twitch.adCpm * PLATFORM_RATES.twitch.adCreatorCut;
  const twTotal = twSubs + twAds;

  const kiSubs = subs * PLATFORM_RATES.kick.creatorCutAmount;
  const kiAds = 0;
  const kiTotal = kiSubs + kiAds;

  const el = id => document.getElementById(id);
  if (el('calc-twitch-subs')) el('calc-twitch-subs').textContent = formatMoney(twSubs);
  if (el('calc-twitch-ads')) el('calc-twitch-ads').textContent = formatMoney(twAds);
  if (el('calc-twitch-total')) el('calc-twitch-total').textContent = formatMoney(twTotal);
  if (el('calc-kick-subs')) el('calc-kick-subs').textContent = formatMoney(kiSubs);
  if (el('calc-kick-ads')) el('calc-kick-ads').textContent = '$0';
  if (el('calc-kick-total')) el('calc-kick-total').textContent = formatMoney(kiTotal);
}

['calc-subs', 'calc-viewers', 'calc-hours'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateCompareCalc);
});
updateCompareCalc();

// ===================== EARNINGS CALCULATOR =====================
function updateEarningsCalc() {
  const val = id => parseInt(document.getElementById(id)?.value) || 0;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

  const ytLfViews = val('earn-yt-views');
  const ytShViews = val('earn-yt-shorts');
  const ytLfRev = (ytLfViews / 1000) * PLATFORM_RATES.youtube.longform.cpmAvg;
  const ytShRev = (ytShViews / 1000) * PLATFORM_RATES.youtube.shorts.rpmAvg;
  set('earn-yt-lf-rev', formatMoney(ytLfRev));
  set('earn-yt-sh-rev', formatMoney(ytShRev));
  set('earn-yt-total', formatMoney(ytLfRev + ytShRev));

  const ttViews = val('earn-tt-views');
  const ttRev = (ttViews / 1000) * PLATFORM_RATES.tiktok.rpmAvg;
  set('earn-tt-total', formatMoney(ttRev));

  const twSubs = val('earn-tw-subs');
  const twViewers = val('earn-tw-viewers');
  const twHours = val('earn-tw-hours');
  const twSubRev = twSubs * PLATFORM_RATES.twitch.tiers[0].creatorCut;
  const twAdRev = (twViewers * twHours / 1000) * PLATFORM_RATES.twitch.adCpm * PLATFORM_RATES.twitch.adCreatorCut;
  set('earn-tw-sub-rev', formatMoney(twSubRev));
  set('earn-tw-ad-rev', formatMoney(twAdRev));
  set('earn-tw-total', formatMoney(twSubRev + twAdRev));

  const kiSubs = val('earn-ki-subs');
  const kiRev = kiSubs * PLATFORM_RATES.kick.creatorCutAmount;
  set('earn-ki-total', formatMoney(kiRev));

  const xImpressions = val('earn-x-impressions');
  const xRev = (xImpressions / 1000) * PLATFORM_RATES.twitter.rpmAvg;
  set('earn-x-total', formatMoney(xRev));

  const igViews = val('earn-ig-views');
  const igRev = (igViews / 1000) * PLATFORM_RATES.instagram.rpmAvg;
  set('earn-ig-total', formatMoney(igRev));

  const grandTotal = ytLfRev + ytShRev + ttRev + twSubRev + twAdRev + kiRev + xRev + igRev;
  set('grand-total', formatMoney(grandTotal));
}

['earn-yt-views', 'earn-yt-shorts', 'earn-tt-views', 'earn-tw-subs', 'earn-tw-viewers', 'earn-tw-hours', 'earn-ki-subs', 'earn-x-impressions', 'earn-ig-views'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateEarningsCalc);
});
updateEarningsCalc();

// ===================== INIT =====================
renderTrending();
renderTopEarners();
