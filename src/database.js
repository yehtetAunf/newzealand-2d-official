export async function saveResult(env, key, value) {
  const rawKey = key.replace("result-", "");
  const separatorIndex = rawKey.lastIndexOf("-");
  const resultDate = separatorIndex >= 0 ? rawKey.slice(0, separatorIndex) : rawKey;
  const roundTime = separatorIndex >= 0 ? rawKey.slice(separatorIndex + 1) : "live";

  await env.DB.prepare(`
    INSERT INTO results (
      result_date,
      round_time,
      result
    )
    VALUES (?, ?, ?)
    ON CONFLICT(result_date, round_time)
    DO UPDATE SET
      result = excluded.result,
      updated_at = CURRENT_TIMESTAMP
  `)
  .bind(resultDate, roundTime || "live", value)
  .run();
}

export async function getResult(env, key) {
  const rawKey = key.replace("result-", "");
  const separatorIndex = rawKey.lastIndexOf("-");
  const resultDate = separatorIndex >= 0 ? rawKey.slice(0, separatorIndex) : rawKey;
  const roundTime = separatorIndex >= 0 ? rawKey.slice(separatorIndex + 1) : "live";

  const result = await env.DB.prepare(`
    SELECT result
    FROM results
    WHERE result_date = ?
    AND round_time = ?
  `)
  .bind(resultDate, roundTime || "live")
  .first();

  return result?.result || null;
}

export async function addChannel(env, channelId, channelName = "") {
  await env.DB.prepare(`
    INSERT INTO channels (
      channel_id,
      channel_name
    )
    VALUES (?, ?)
    ON CONFLICT(channel_id)
    DO UPDATE SET
      channel_name = excluded.channel_name,
      is_active = 1,
      updated_at = CURRENT_TIMESTAMP
  `)
  .bind(String(channelId), channelName || "")
  .run();
}

export async function getChannels(env) {
  const result = await env.DB.prepare(`
    SELECT channel_id
    FROM channels
    WHERE is_active = 1
    ORDER BY id ASC
  `).all();

  return result.results || [];
}

export async function upsertPostTarget(env, chat, member = {}, addedByUserId = null) {
  if (!chat?.id || !["channel","group","supergroup"].includes(chat.type)) {
    return false;
  }

  const status = String(member.status || "member");

  const canPostMessages =
    chat.type !== "channel" ||
    status === "creator" ||
    Boolean(member.can_post_messages);

  const isActive =
    (status === "administrator" || status === "creator") &&
    canPostMessages;

  await env.DB.prepare(`
    INSERT INTO post_targets (
      chat_id,
      chat_type,
      title,
      username,
      bot_status,
      can_post_messages,
      is_active,
      added_by_user_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(chat_id)
    DO UPDATE SET
      chat_type = excluded.chat_type,
      title = excluded.title,
      username = excluded.username,
      bot_status = excluded.bot_status,
      can_post_messages = excluded.can_post_messages,
      is_active = excluded.is_active,
      added_by_user_id = excluded.added_by_user_id,
      updated_at = CURRENT_TIMESTAMP
  `)
  .bind(
    String(chat.id),
    chat.type,
    chat.title || "",
    chat.username || "",
    status,
    canPostMessages ? 1 : 0,
    isActive ? 1 : 0,
    addedByUserId ? String(addedByUserId) : null
  )
  .run();

  return isActive;
}

export async function deactivatePostTarget(env, chatId, botStatus = "left") {
  await env.DB.prepare(`
    UPDATE post_targets
    SET
      bot_status = ?,
      can_post_messages = 0,
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE chat_id = ?
  `)
  .bind(botStatus, String(chatId))
  .run();
}

export async function getActivePostTargets(env) {
  const result = await env.DB.prepare(`
    SELECT *
    FROM post_targets
    WHERE is_active = 1
    ORDER BY updated_at ASC
  `).all();

  return result.results || [];
    }
