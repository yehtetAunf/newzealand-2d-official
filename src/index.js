import { fetchResult } from "./api.js";
import { sendMessage } from "./telegram.js";
import { saveResult, getResult } from "./database.js";
import { getMyanmarTime, formatResult } from "./utils.js";

export default {
  async fetch(request, env) {
    try {
      const data = await fetchResult(env.API_URL);

      const result = data.result || data.number || data.value;
      const date = data.date || "";
      const time = getMyanmarTime();

      const key = `result-${date}`;
      const oldResult = await getResult(env, key);

      if (oldResult !== result) {
        const message = formatResult(date, time, result);

        await sendMessage(
          env.BOT_TOKEN,
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
