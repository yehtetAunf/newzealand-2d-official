export async function saveResult(env, key, value) {
  const [resultDate, roundTime] = key.replace("result-", "").split("-");

  await env.DB.prepare(
    `
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
    `
  )
  .bind(
    resultDate,
    roundTime || "live",
    value
  )
  .run();
}


export async function getResult(env, key) {
  const [resultDate, roundTime] = key.replace("result-", "").split("-");

  const result = await env.DB.prepare(
    `
    SELECT result
    FROM results
    WHERE result_date = ?
    AND round_time = ?
    `
  )
  .bind(
    resultDate,
    roundTime || "live"
  )
  .first();

  return result?.result || null;
}

export async function addChannel(env, channelId, channelName = "") {
  await env.DB.prepare(
    `
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
    `
  )
  .bind(
    channelId,
    channelName
  )
  .run();
}


export async function getChannels(env) {
  const result = await env.DB.prepare(
    `
    SELECT channel_id
    FROM channels
    WHERE is_active = 1
    `
  )
  .all();

  return result.results || [];
    }
