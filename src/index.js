import { fetchResult } from "./api.js";
import { sendMessage, sendPhoto } from "./telegram.js";
import { saveResult, getResult, addChannel, getChannels } from "./database.js";
import { getMyanmarTime, formatResult } from "./utils.js";

export default {
  async fetch(request, env) {
    try {

      // Telegram Webhook
if (request.method === "POST") {
  const update = await request.json();

  // Channel Register
  if (update.message?.text === "/register") {
    const chatId = update.message.chat.id;
    const title = update.message.chat.title || "";

    await addChannel(
      env,
      chatId,
      title
    );

    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      "✅ Channel registered successfully"
    );

    return new Response("OK");
  }


  // Live Result
  if (update.message?.text === "/live") {
    const data = await fetchResult(env.API_URL);

    const result = data.live?.result || "--";
    const date = data.date || "";
    const time = getMyanmarTime();

    const message = formatResult(date, time, result);

    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      update.message.chat.id,
      message
    );

    return new Response("OK");
  }
}
