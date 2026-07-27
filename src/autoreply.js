import { CONFIG } from "./config.js";
export async function handleMessage(text) {
  const msg = text.trim().toLowerCase();
  if (msg === "/start") {
  return `🤖 ${CONFIG.BOT_NAME}`;
      }
}
