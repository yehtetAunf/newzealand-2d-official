export async function saveResult(env, key, value) {
  await env.DB.put(key, value);
}

export async function getResult(env, key) {
  return await env.DB.get(key);
}
