import { handleMessage } from "./bot.js";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("New Zealand 2D Bot is Running ✅");
    }

    const update = await request.json();

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || "";

      const reply = await handleMessage(text);

      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    chat_id: chatId,
    photo: "https://newzealand2d.com/result.jpg",
    caption: reply,
    parse_mode: "HTML"
  })
});
    }

    return new Response("OK");
  }
};

