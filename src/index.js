import { fetchResult } from "./api.js";
import { sendMessage, sendPhoto } from "./telegram.js";
import {
  saveResult,
  getResult,
  addChannel,
  getChannels
} from "./database.js";
import {
  getMyanmarTime,
  formatResult
} from "./utils.js";
import { createPoster } from "./poster.js";


async function autoPost(env) {

  const data = await fetchResult(env.API_URL);

  const result = data.live?.result || "--";
  const date = data.date || "";
  const time = getMyanmarTime();


  const key = `result-${date}`;


  const oldResult = await getResult(
    env,
    key
  );


  if (oldResult === result) {
    return "No new result";
  }


  await saveResult(
    env,
    key,
    result
  );


  const poster = await createPoster(
    env.POSTER_BACKGROUND_URL,
    date,
    time,
    result
  );


  const channels = await getChannels(env);


  for (const channel of channels) {

    await sendPhoto(
      env.TELEGRAM_BOT_TOKEN,
      channel.channel_id,
      poster.photo,
      poster.caption
    );

  }


  return "Posted";
}



export default {

  // Telegram Webhook
  async fetch(request, env) {

    try {


      if (request.method === "POST") {

        const update = await request.json();


        // Register Channel

        if (update.message?.text === "/register") {


          const chatId = update.message.chat.id;

          const title =
            update.message.chat.title || "";


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



        // Live Command

        if (update.message?.text === "/live") {


          const data =
            await fetchResult(env.API_URL);


          const result =
            data.live?.result || "--";


          const date =
            data.date || "";


          const time =
            getMyanmarTime();



          const message =
            formatResult(
              date,
              time,
              result
            );



          await sendMessage(
            env.TELEGRAM_BOT_TOKEN,
            update.message.chat.id,
            message
          );


          return new Response("OK");

        }

      }


      return new Response("OK");


    } catch (error) {


      return new Response(
        "Error: " + error.message,
        {
          status: 500
        }
      );

    }

  },



  // Cloudflare Cron Trigger

  async scheduled(event, env, ctx) {

    try {

      await autoPost(env);

    } catch (error) {

      console.log(
        "Auto Post Error:",
        error.message
      );

    }

  }

};
