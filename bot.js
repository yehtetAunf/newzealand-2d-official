import { config } from "./config.js";

export async function handleMessage(text) {
  if (text === "/start") {
    return `🤖 ${config.BOT_NAME}

မင်္ဂလာပါ။
New Zealand 2D Official Bot မှ ကြိုဆိုပါတယ် 🇳🇿`;
  }

  if (text.toLowerCase() === "hello") {
    return "👋 Hello! Welcome.";
  }

  return "📩 သင့်စာကို လက်ခံရရှိပါတယ်။";
}
