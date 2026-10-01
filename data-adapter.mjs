const clean = (value, fallback = "") => String(value ?? fallback).trim().slice(0, 500);

export function normalizeVideo(item = {}) {
  return {
    id: clean(item.id),
    title: clean(item.title),
    create_time: Number(item.create_time) || null,
    view_count: Math.max(0, Number(item.view_count ?? item.views) || 0),
    like_count: Math.max(0, Number(item.like_count ?? item.likes) || 0),
    comment_count: Math.max(0, Number(item.comment_count ?? item.comments) || 0),
    share_count: Math.max(0, Number(item.share_count ?? item.shares) || 0)
  };
}

export function normalizeVideoList(data = {}) {
  const videos = Array.isArray(data?.videos) ? data.videos : Array.isArray(data) ? data : [];
  return videos.map(normalizeVideo).filter((item) => item.id);
}

export function normalizeUserStats(user = {}) {
  return {
    follower_count: Math.max(0, Number(user.follower_count) || 0),
    following_count: Math.max(0, Number(user.following_count) || 0),
    likes_count: Math.max(0, Number(user.likes_count) || 0),
    video_count: Math.max(0, Number(user.video_count) || 0)
  };
}

export function buildPerformanceInput(videos = []) {
  return {
    items: normalizeVideoList(videos).map((video) => ({
      id: video.id,
      title: video.title,
      views: video.view_count,
      likes: video.like_count,
      comments: video.comment_count,
      shares: video.share_count,
      conversions: 0
    }))
  };
}

export const dataAdapter = {
  version: "tiktok-display-v1",
  normalizeVideo,
  normalizeVideoList,
  normalizeUserStats,
  buildPerformanceInput
};
