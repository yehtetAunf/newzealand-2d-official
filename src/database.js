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
