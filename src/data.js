export const PLATFORM_RATES = {
  youtube: {
    longform: { cpmLow: 3, cpmHigh: 8, cpmAvg: 5, label: 'CPM (per 1K views)' },
    shorts: { rpmLow: 0.04, rpmHigh: 0.08, rpmAvg: 0.06, label: 'RPM (per 1K views)' },
  },
  tiktok: {
    rpmLow: 0.02, rpmHigh: 0.05, rpmAvg: 0.035, label: 'Creator Fund RPM (per 1K views)',
  },
  twitch: {
    subPrice: 4.99,
    creatorSubCut: 0.50,
    adCpm: 3.50,
    adCreatorCut: 0.55,
    bitsValue: 0.01,
    tiers: [
      { name: 'Tier 1', price: 4.99, creatorCut: 2.50 },
      { name: 'Tier 2', price: 9.99, creatorCut: 5.00 },
      { name: 'Tier 3', price: 24.99, creatorCut: 12.50 },
    ],
  },
  kick: {
    subPrice: 4.99,
    creatorSubCut: 0.95,
    creatorCutAmount: 4.74,
  },
  twitter: {
    rpmLow: 0.10, rpmHigh: 0.30, rpmAvg: 0.20, label: 'Ad Rev Share RPM (per 1K impressions)',
  },
  instagram: {
    rpmLow: 0.01, rpmHigh: 0.03, rpmAvg: 0.02, label: 'Reels Bonus RPM (per 1K views)',
  },
};

export const creators = [
  {
    id: 'mrbeast',
    name: 'MrBeast',
    handle: '@MrBeast',
    avatar: 'MB',
    platforms: {
      youtube: {
        subscribers: 345000000,
        totalViews: 52000000000,
        longform: {
          monthlyViews: 420000000,
          totalViews: 45000000000,
          avgViewsPerVideo: 85000000,
          videos: 820,
          cpm: 7.50,
        },
        shorts: {
          monthlyViews: 180000000,
          totalViews: 7000000000,
          avgViewsPerVideo: 25000000,
          videos: 280,
          rpm: 0.06,
        },
      },
      twitter: {
        followers: 32000000,
        monthlyImpressions: 450000000,
        monthlyLikes: 12000000,
        totalTweets: 18500,
      },
      instagram: {
        followers: 58000000,
        monthlyReelsViews: 320000000,
        monthlyLikes: 45000000,
        posts: 1250,
      },
      tiktok: {
        followers: 105000000,
        monthlyViews: 850000000,
        monthlyLikes: 55000000,
        totalLikes: 2800000000,
        videos: 620,
      },
    },
  },
  {
    id: 'ninja',
    name: 'Ninja',
    handle: '@Ninja',
    avatar: 'NJ',
    platforms: {
      twitch: {
        followers: 19000000,
        subscribers: 8500,
        avgViewers: 12000,
        peakViewers: 45000,
        hoursStreamed: 140,
      },
      youtube: {
        subscribers: 24000000,
        totalViews: 3200000000,
        longform: {
          monthlyViews: 15000000,
          totalViews: 2800000000,
          avgViewsPerVideo: 1200000,
          videos: 2300,
          cpm: 4.50,
        },
        shorts: {
          monthlyViews: 8000000,
          totalViews: 400000000,
          avgViewsPerVideo: 800000,
          videos: 150,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 7800000,
        monthlyImpressions: 85000000,
        monthlyLikes: 2200000,
        totalTweets: 42000,
      },
      kick: {
        followers: 320000,
        subscribers: 2200,
      },
    },
  },
  {
    id: 'pokimane',
    name: 'Pokimane',
    handle: '@pokimanelol',
    avatar: 'PK',
    platforms: {
      twitch: {
        followers: 9500000,
        subscribers: 6200,
        avgViewers: 8500,
        peakViewers: 35000,
        hoursStreamed: 100,
      },
      youtube: {
        subscribers: 7200000,
        totalViews: 1100000000,
        longform: {
          monthlyViews: 12000000,
          totalViews: 900000000,
          avgViewsPerVideo: 2500000,
          videos: 650,
          cpm: 5.20,
        },
        shorts: {
          monthlyViews: 6000000,
          totalViews: 200000000,
          avgViewsPerVideo: 600000,
          videos: 120,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 4200000,
        monthlyImpressions: 55000000,
        monthlyLikes: 1800000,
        totalTweets: 28000,
      },
      instagram: {
        followers: 7100000,
        monthlyReelsViews: 18000000,
        monthlyLikes: 3200000,
        posts: 860,
      },
      tiktok: {
        followers: 9800000,
        monthlyViews: 45000000,
        monthlyLikes: 4500000,
        totalLikes: 280000000,
        videos: 310,
      },
    },
  },
  {
    id: 'kaicenat',
    name: 'Kai Cenat',
    handle: '@KaiCenat',
    avatar: 'KC',
    platforms: {
      twitch: {
        followers: 15000000,
        subscribers: 115000,
        avgViewers: 85000,
        peakViewers: 720000,
        hoursStreamed: 180,
      },
      youtube: {
        subscribers: 19500000,
        totalViews: 2800000000,
        longform: {
          monthlyViews: 95000000,
          totalViews: 2200000000,
          avgViewsPerVideo: 8500000,
          videos: 420,
          cpm: 6.00,
        },
        shorts: {
          monthlyViews: 65000000,
          totalViews: 600000000,
          avgViewsPerVideo: 3500000,
          videos: 200,
          rpm: 0.06,
        },
      },
      kick: {
        followers: 1200000,
        subscribers: 18000,
      },
      tiktok: {
        followers: 18000000,
        monthlyViews: 280000000,
        monthlyLikes: 22000000,
        totalLikes: 850000000,
        videos: 480,
      },
      instagram: {
        followers: 12000000,
        monthlyReelsViews: 45000000,
        monthlyLikes: 8500000,
        posts: 320,
      },
      twitter: {
        followers: 5200000,
        monthlyImpressions: 120000000,
        monthlyLikes: 4500000,
        totalTweets: 8200,
      },
    },
  },
  {
    id: 'charlidamelio',
    name: "Charli D'Amelio",
    handle: '@charlidamelio',
    avatar: 'CD',
    platforms: {
      tiktok: {
        followers: 155000000,
        monthlyViews: 450000000,
        monthlyLikes: 35000000,
        totalLikes: 11500000000,
        videos: 2800,
      },
      instagram: {
        followers: 55000000,
        monthlyReelsViews: 120000000,
        monthlyLikes: 18000000,
        posts: 1850,
      },
      youtube: {
        subscribers: 10500000,
        totalViews: 750000000,
        longform: {
          monthlyViews: 5000000,
          totalViews: 600000000,
          avgViewsPerVideo: 3200000,
          videos: 180,
          cpm: 4.00,
        },
        shorts: {
          monthlyViews: 12000000,
          totalViews: 150000000,
          avgViewsPerVideo: 1500000,
          videos: 100,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 6500000,
        monthlyImpressions: 40000000,
        monthlyLikes: 1500000,
        totalTweets: 5600,
      },
    },
  },
  {
    id: 'ishowspeed',
    name: 'IShowSpeed',
    handle: '@IShowSpeed',
    avatar: 'IS',
    platforms: {
      youtube: {
        subscribers: 35000000,
        totalViews: 12000000000,
        longform: {
          monthlyViews: 280000000,
          totalViews: 9500000000,
          avgViewsPerVideo: 12000000,
          videos: 1800,
          cpm: 5.50,
        },
        shorts: {
          monthlyViews: 120000000,
          totalViews: 2500000000,
          avgViewsPerVideo: 5000000,
          videos: 500,
          rpm: 0.06,
        },
      },
      kick: {
        followers: 2800000,
        subscribers: 25000,
      },
      tiktok: {
        followers: 32000000,
        monthlyViews: 380000000,
        monthlyLikes: 28000000,
        totalLikes: 1200000000,
        videos: 550,
      },
      twitter: {
        followers: 8500000,
        monthlyImpressions: 200000000,
        monthlyLikes: 6000000,
        totalTweets: 12000,
      },
      instagram: {
        followers: 22000000,
        monthlyReelsViews: 85000000,
        monthlyLikes: 12000000,
        posts: 680,
      },
    },
  },
  {
    id: 'xqc',
    name: 'xQc',
    handle: '@xQc',
    avatar: 'XQ',
    platforms: {
      kick: {
        followers: 2100000,
        subscribers: 42000,
      },
      twitch: {
        followers: 12500000,
        subscribers: 3200,
        avgViewers: 5000,
        peakViewers: 150000,
        hoursStreamed: 200,
      },
      youtube: {
        subscribers: 14000000,
        totalViews: 4500000000,
        longform: {
          monthlyViews: 65000000,
          totalViews: 3800000000,
          avgViewsPerVideo: 3500000,
          videos: 1500,
          cpm: 4.80,
        },
        shorts: {
          monthlyViews: 35000000,
          totalViews: 700000000,
          avgViewsPerVideo: 2000000,
          videos: 350,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 3200000,
        monthlyImpressions: 95000000,
        monthlyLikes: 3800000,
        totalTweets: 35000,
      },
    },
  },
  {
    id: 'markiplier',
    name: 'Markiplier',
    handle: '@markaboreanaz',
    avatar: 'MK',
    platforms: {
      youtube: {
        subscribers: 37000000,
        totalViews: 20000000000,
        longform: {
          monthlyViews: 85000000,
          totalViews: 18500000000,
          avgViewsPerVideo: 3200000,
          videos: 5800,
          cpm: 6.20,
        },
        shorts: {
          monthlyViews: 15000000,
          totalViews: 1500000000,
          avgViewsPerVideo: 1200000,
          videos: 180,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 16000000,
        monthlyImpressions: 65000000,
        monthlyLikes: 2800000,
        totalTweets: 22000,
      },
      instagram: {
        followers: 12000000,
        monthlyReelsViews: 25000000,
        monthlyLikes: 4500000,
        posts: 750,
      },
      tiktok: {
        followers: 22000000,
        monthlyViews: 120000000,
        monthlyLikes: 12000000,
        totalLikes: 580000000,
        videos: 280,
      },
    },
  },
  {
    id: 'adinross',
    name: 'Adin Ross',
    handle: '@AdinRoss',
    avatar: 'AR',
    platforms: {
      kick: {
        followers: 8500000,
        subscribers: 55000,
      },
      youtube: {
        subscribers: 5200000,
        totalViews: 820000000,
        longform: {
          monthlyViews: 18000000,
          totalViews: 650000000,
          avgViewsPerVideo: 2800000,
          videos: 350,
          cpm: 4.50,
        },
        shorts: {
          monthlyViews: 12000000,
          totalViews: 170000000,
          avgViewsPerVideo: 1500000,
          videos: 120,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 2800000,
        monthlyImpressions: 75000000,
        monthlyLikes: 2200000,
        totalTweets: 6500,
      },
      instagram: {
        followers: 4500000,
        monthlyReelsViews: 22000000,
        monthlyLikes: 3200000,
        posts: 420,
      },
      tiktok: {
        followers: 8200000,
        monthlyViews: 95000000,
        monthlyLikes: 8500000,
        totalLikes: 420000000,
        videos: 380,
      },
    },
  },
  {
    id: 'khaby',
    name: 'Khaby Lame',
    handle: '@khaboreanaz00',
    avatar: 'KL',
    platforms: {
      tiktok: {
        followers: 162000000,
        monthlyViews: 600000000,
        monthlyLikes: 40000000,
        totalLikes: 2500000000,
        videos: 1200,
      },
      instagram: {
        followers: 82000000,
        monthlyReelsViews: 250000000,
        monthlyLikes: 30000000,
        posts: 580,
      },
      youtube: {
        subscribers: 25000000,
        totalViews: 650000000,
        longform: {
          monthlyViews: 8000000,
          totalViews: 450000000,
          avgViewsPerVideo: 5000000,
          videos: 90,
          cpm: 4.00,
        },
        shorts: {
          monthlyViews: 35000000,
          totalViews: 200000000,
          avgViewsPerVideo: 8000000,
          videos: 60,
          rpm: 0.06,
        },
      },
      twitter: {
        followers: 4500000,
        monthlyImpressions: 35000000,
        monthlyLikes: 1200000,
        totalTweets: 3200,
      },
    },
  },
  {
    id: 'pewdiepie',
    name: 'PewDiePie',
    handle: '@PewDiePie',
    avatar: 'PD',
    platforms: {
      youtube: {
        subscribers: 111000000,
        totalViews: 29000000000,
        longform: {
          monthlyViews: 45000000,
          totalViews: 27000000000,
          avgViewsPerVideo: 5500000,
          videos: 4800,
          cpm: 5.80,
        },
        shorts: {
          monthlyViews: 10000000,
          totalViews: 2000000000,
          avgViewsPerVideo: 2000000,
          videos: 200,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 19500000,
        monthlyImpressions: 40000000,
        monthlyLikes: 1500000,
        totalTweets: 14000,
      },
      instagram: {
        followers: 22000000,
        monthlyReelsViews: 12000000,
        monthlyLikes: 3000000,
        posts: 720,
      },
    },
  },
  {
    id: 'shroud',
    name: 'Shroud',
    handle: '@shroud',
    avatar: 'SH',
    platforms: {
      twitch: {
        followers: 10800000,
        subscribers: 5500,
        avgViewers: 15000,
        peakViewers: 52000,
        hoursStreamed: 120,
      },
      youtube: {
        subscribers: 7200000,
        totalViews: 1500000000,
        longform: {
          monthlyViews: 8000000,
          totalViews: 1300000000,
          avgViewsPerVideo: 1200000,
          videos: 1100,
          cpm: 4.50,
        },
        shorts: {
          monthlyViews: 3000000,
          totalViews: 200000000,
          avgViewsPerVideo: 600000,
          videos: 80,
          rpm: 0.05,
        },
      },
      twitter: {
        followers: 4200000,
        monthlyImpressions: 30000000,
        monthlyLikes: 900000,
        totalTweets: 9800,
      },
    },
  },
];

export function estimateEarnings(creator) {
  let total = 0;
  const breakdown = {};
  const p = creator.platforms;

  if (p.youtube) {
    const lfRev = (p.youtube.longform.monthlyViews / 1000) * p.youtube.longform.cpm;
    const shRev = (p.youtube.shorts.monthlyViews / 1000) * p.youtube.shorts.rpm;
    breakdown.youtube = { longform: lfRev, shorts: shRev, total: lfRev + shRev };
    total += lfRev + shRev;
  }

  if (p.twitch) {
    const subRev = p.twitch.subscribers * PLATFORM_RATES.twitch.tiers[0].creatorCut;
    const adImpressions = p.twitch.avgViewers * p.twitch.hoursStreamed;
    const adRev = (adImpressions / 1000) * PLATFORM_RATES.twitch.adCpm * PLATFORM_RATES.twitch.adCreatorCut;
    breakdown.twitch = { subs: subRev, ads: adRev, total: subRev + adRev };
    total += subRev + adRev;
  }

  if (p.kick) {
    const subRev = p.kick.subscribers * PLATFORM_RATES.kick.creatorCutAmount;
    breakdown.kick = { subs: subRev, total: subRev };
    total += subRev;
  }

  if (p.tiktok) {
    const rev = (p.tiktok.monthlyViews / 1000) * PLATFORM_RATES.tiktok.rpmAvg;
    breakdown.tiktok = { total: rev };
    total += rev;
  }

  if (p.twitter) {
    const rev = (p.twitter.monthlyImpressions / 1000) * PLATFORM_RATES.twitter.rpmAvg;
    breakdown.twitter = { total: rev };
    total += rev;
  }

  if (p.instagram) {
    const rev = (p.instagram.monthlyReelsViews / 1000) * PLATFORM_RATES.instagram.rpmAvg;
    breakdown.instagram = { total: rev };
    total += rev;
  }

  return { total, breakdown };
}

export function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function formatMoney(n) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

export function generateTimeSeries(baseValue, days, variance = 0.15) {
  const data = [];
  let current = baseValue;
  for (let i = 0; i < days; i++) {
    const change = 1 + (Math.random() - 0.48) * variance;
    current = Math.max(current * change, baseValue * 0.5);
    data.push(Math.round(current));
  }
  return data;
}
