export function validateDirectPostInput(input = {}, creatorInfo = {}) {
  const fail = (status, error, details = {}) => ({ ok: false, status, error, ...details });
  const privacyOptions = Array.isArray(creatorInfo.privacy_level_options)
    ? creatorInfo.privacy_level_options.filter((value) => typeof value === "string")
    : [];

  if (input.user_consent !== true) return fail(400, "explicit_user_consent_required");
  if (!privacyOptions.length) return fail(502, "creator_privacy_options_unavailable");

  const privacyLevel = String(input.privacy_level || "").trim();
  if (!privacyLevel) return fail(400, "privacy_level_selection_required", { allowed: privacyOptions });
  if (!privacyOptions.includes(privacyLevel)) return fail(400, "privacy_level_invalid", { allowed: privacyOptions });

  const videoDuration = Number(input.video_duration_sec);
  const maxDuration = Number(creatorInfo.max_video_post_duration_sec);
  if (!Number.isFinite(videoDuration) || videoDuration <= 0) return fail(400, "video_duration_required");
  if (!Number.isFinite(maxDuration) || maxDuration <= 0) return fail(502, "creator_duration_limit_unavailable");
  if (videoDuration > maxDuration) {
    return fail(400, "video_duration_exceeds_creator_limit", {
      video_duration_sec: videoDuration,
      max_video_post_duration_sec: maxDuration
    });
  }

  for (const key of ["disable_comment", "disable_duet", "disable_stitch"]) {
    if (typeof input[key] !== "boolean") return fail(400, "interaction_settings_required", { field: key });
  }
  if (creatorInfo.comment_disabled === true && input.disable_comment !== true) return fail(400, "creator_comment_setting_restricted");
  if (creatorInfo.duet_disabled === true && input.disable_duet !== true) return fail(400, "creator_duet_setting_restricted");
  if (creatorInfo.stitch_disabled === true && input.disable_stitch !== true) return fail(400, "creator_stitch_setting_restricted");

  if (typeof input.commercial_content_toggle !== "boolean" ||
      typeof input.brand_organic_toggle !== "boolean" ||
      typeof input.brand_content_toggle !== "boolean") {
    return fail(400, "commercial_disclosure_settings_required");
  }
  const hasDisclosure = input.brand_organic_toggle || input.brand_content_toggle;
  if (input.commercial_content_toggle && !hasDisclosure) return fail(400, "commercial_disclosure_selection_required");
  if (!input.commercial_content_toggle && hasDisclosure) return fail(400, "commercial_disclosure_settings_inconsistent");
  if (input.brand_content_toggle && privacyLevel === "SELF_ONLY") return fail(400, "branded_content_cannot_be_private");

  return {
    ok: true, privacyLevel, videoDuration, maxDuration,
    disableComment: input.disable_comment, disableDuet: input.disable_duet, disableStitch: input.disable_stitch,
    commercialContent: input.commercial_content_toggle,
    brandOrganic: input.brand_organic_toggle, brandContent: input.brand_content_toggle
  };
}
