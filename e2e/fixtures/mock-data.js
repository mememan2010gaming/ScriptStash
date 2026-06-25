'use strict';

const MOCK_USER = {
  id: 42,
  username: 'TestUser',
  name: 'Test User',
  avatar_template: '/letter_avatar_proxy/v4/letter/t/7e3bff/{size}.png',
  trust_level: 2,
};

// Produces a topic in the shape api.service returns after enrichment (camelCase).
const makeTopic = (overrides = {}) => {
  const raw = {
    id: overrides.id ?? 1001,
    title: overrides.title ?? 'Test Script - Sample Video [FREE]',
    slug: overrides.slug ?? 'test-script-sample-video-free',
    posts_count: overrides.posts_count ?? 3,
    reply_count: overrides.reply_count ?? 2,
    views: overrides.views ?? 1234,
    like_count: overrides.like_count ?? 56,
    created_at: '2024-01-15T12:00:00.000Z',
    last_posted_at: '2024-02-01T08:30:00.000Z',
    category_id: 42,
    tags: overrides.tags ?? ['free', 'pov', 'blowjob'],
    image_url: null,
    excerpt: 'A great test script with excellent sync quality.',
    archetype: 'regular',
    pinned: false,
    visible: true,
    closed: false,
    has_accepted_answer: false,
    // Enriched fields added by api.service
    isPaid: overrides.isPaid ?? false,
    videoLinks: overrides.videoLinks ?? [
      { url: 'https://example.com/video.mp4', label: 'Direct Link', type: 'direct' },
    ],
    funscriptLinks: overrides.funscriptLinks ?? [
      { url: 'https://example.com/script.funscript', label: 'Funscript', filename: 'test-script.funscript' },
    ],
    duration: overrides.duration ?? null,
    ...overrides,
  };

  // Camelcase aliases that api.service normally adds
  return {
    ...raw,
    likeCount: raw.like_count,
    postsCount: raw.posts_count,
    createdAt: raw.created_at,
    lastPostedAt: raw.last_posted_at,
    imageUrl: raw.image_url,
    author: overrides.author ?? { username: 'scriptmaker', avatar: null },
    hue: (raw.id ?? 1001) % 360,
  };
};

const MOCK_TOPICS = [
  makeTopic({ id: 1001, title: 'Amazing PMV Script [FREE]', views: 5000, like_count: 120, tags: ['free', 'pmv'] }),
  makeTopic({ id: 1002, title: 'Premium POV Script [PAID]', isPaid: true, tags: ['paid', 'pov'], like_count: 88 }),
  makeTopic({ id: 1003, title: 'Vanilla Scene Sync', views: 800, like_count: 22, tags: ['free', 'vanilla'] }),
  makeTopic({ id: 1004, title: 'BDSM Compilation Script', views: 3100, like_count: 67, tags: ['free', 'bdsm'] }),
  makeTopic({ id: 1005, title: 'Hentai Loop Script [PAID]', isPaid: true, tags: ['paid', 'hentai'], like_count: 44 }),
  makeTopic({ id: 1006, title: 'SFM Animation Sync', views: 920, like_count: 31, tags: ['free', 'sfm'] }),
  makeTopic({ id: 1007, title: 'JAV Script Collection', views: 2200, like_count: 55, tags: ['free', 'jav'] }),
  makeTopic({ id: 1008, title: 'Creampie Compilation', views: 1800, like_count: 49, tags: ['free', 'compilation'] }),
];

// Enriched topic detail shape that TopicDetail.jsx expects after api.service processes it.
const MOCK_TOPIC_DETAIL = {
  ...makeTopic({ id: 1001, title: 'Amazing PMV Script [FREE]', views: 5000, like_count: 120, tags: ['free', 'pmv'] }),
  likeCount: 120,
  postsCount: 3,
  mainPost: {
    id: 5001,
    cooked: `<p>Here is my PMV script for an amazing video!</p>
      <p><a href="https://www.pornhub.com/view_video.php?viewkey=abc123">Watch on PornHub</a></p>
      <p>Download the script: <a href="https://example.com/amazing-pmv.funscript">amazing-pmv.funscript</a></p>`,
    currentUserLiked: false,
    likeCount: 42,
    author: { username: 'scriptmaker', avatar: null },
    createdAt: '2024-01-15T12:00:00.000Z',
  },
  downloads: {
    funscripts: [
      { url: 'https://example.com/amazing-pmv.funscript', label: 'Funscript', filename: 'amazing-pmv.funscript' },
    ],
    rankedVideos: [
      { url: 'https://www.pornhub.com/view_video.php?viewkey=abc123', label: 'PornHub', type: 'pornhub' },
    ],
    videos: [],
  },
  comments: [
    {
      id: 5002,
      cooked: '<p>Great script, thanks for sharing!</p>',
      author: { username: 'fan123', avatar: null },
      likeCount: 3,
      createdAt: '2024-01-16T09:00:00.000Z',
    },
  ],
  post_stream: {
    posts: [
      {
        id: 5001,
        post_number: 1,
        username: 'scriptmaker',
        cooked: `<p>Here is my PMV script for an amazing video!</p>
          <p><a href="https://www.pornhub.com/view_video.php?viewkey=abc123">Watch on PornHub</a></p>
          <p>Download the script: <a href="https://example.com/amazing-pmv.funscript">amazing-pmv.funscript</a></p>`,
        created_at: '2024-01-15T12:00:00.000Z',
        like_count: 42,
        yours: false,
      },
      {
        id: 5002,
        post_number: 2,
        username: 'fan123',
        cooked: '<p>Great script, thanks for sharing!</p>',
        created_at: '2024-01-16T09:00:00.000Z',
        like_count: 3,
        yours: false,
      },
    ],
  },
  details: {
    created_by: { id: 100, username: 'scriptmaker' },
    participants: [
      { id: 100, username: 'scriptmaker', post_count: 1 },
      { id: 101, username: 'fan123', post_count: 1 },
    ],
  },
};

const MOCK_SEARCH_RESULTS = {
  topics: [
    makeTopic({ id: 2001, title: 'Search Result One', views: 500 }),
    makeTopic({ id: 2002, title: 'Search Result Two', views: 300 }),
  ],
  posts: [],
  users: [],
  categories: [],
  tags: [],
  grouped_search_result: {
    term: 'test query',
    search_log_id: 999,
    type_filter: 'topic',
    post_ids: [],
    user_ids: [],
    category_ids: [],
    tag_ids: [],
    topic_ids: [2001, 2002],
    more_full_page_results: false,
  },
};

const MOCK_DOWNLOAD_PATH = 'C:\\Users\\TestUser\\Downloads\\ScriptStash';
const MOCK_APP_VERSION = '2.4.29';

const MOCK_SETTINGS = {
  notifications: true,
  autoCheckUpdates: true,
  adBlocker: false,
  devMode: false,
  maxSimultaneousDownloads: 3,
  downloadPath: MOCK_DOWNLOAD_PATH,
};

const MOCK_ADBLOCKER_STATUS = {
  enabled: false,
  blocked: 0,
  initialized: true,
};

const MOCK_NOTIFICATIONS = [
  {
    id: 101,
    notification_type: 6,
    read: false,
    created_at: '2024-06-20T10:00:00.000Z',
    topic_id: 1001,
    slug: 'amazing-pmv-script',
    data: { topic_title: 'Amazing PMV Script [FREE]', display_username: 'fan123', original_post_type: 2 },
  },
  {
    id: 102,
    notification_type: 1,
    read: true,
    created_at: '2024-06-19T08:00:00.000Z',
    topic_id: 1002,
    slug: 'premium-pov-script',
    data: { topic_title: 'Premium POV Script [PAID]', display_username: 'user456' },
  },
];

const MOCK_YTDLP_VERSION = '2024.04.09';

const MOCK_THEMES = [
  { id: 'midnight', name: 'Midnight', primary: '#7c3aed' },
  { id: 'ocean', name: 'Ocean', primary: '#0ea5e9' },
  { id: 'rose', name: 'Rose', primary: '#e11d48' },
];

module.exports = {
  MOCK_USER,
  MOCK_TOPICS,
  MOCK_TOPIC_DETAIL,
  MOCK_SEARCH_RESULTS,
  MOCK_DOWNLOAD_PATH,
  MOCK_APP_VERSION,
  MOCK_SETTINGS,
  MOCK_ADBLOCKER_STATUS,
  MOCK_NOTIFICATIONS,
  MOCK_YTDLP_VERSION,
  MOCK_THEMES,
  makeTopic,
};
