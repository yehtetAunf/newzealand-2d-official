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

      // Auto result check
      const data = await fetchResult(env.API_URL);

      const result = data.live?.result || "--";
      const date = data.date || "";
      const time = getMyanmarTime();

      const key = `result-${date}`;
      const oldResult = await getResult(env, key);

      if (oldResult !== result) {
        const message = formatResult(date, time, result);

        await sendMessage(
          env.TELEGRAM_BOT_TOKEN,
          env.CHAT_ID,
          message
        );

        await saveResult(env, key, result);

        return new Response("OK");
      }

      return new Response("No new result");

    } catch (error) {
      return new Response(
        "Error: " + error.message,
        { status: 500 }
      );
    }
  }
};
