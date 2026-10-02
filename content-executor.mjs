import { evaluateAction } from "./autonomy-policy.mjs";

export function buildContentExecution(input = {}) {
  const mediaUrl = String(input.media_url || input.video_url || "").trim();
  const title = String(input.title || "").trim().slice(0, 2200);
  const postsToday = Number(input.posts_today) || 0;
  const policy = evaluateAction("publish_content", { posts_today: postsToday });
  return {
    version: "content-executor-v1",
    ready: Boolean(mediaUrl && /^https:\/\//i.test(mediaUrl) && policy.allowed),
    media_url: mediaUrl || null,
    title,
    policy,
    execution_mode: mediaUrl ? "tiktok_direct_post_pull_from_url" : "media_required"
  };
}
