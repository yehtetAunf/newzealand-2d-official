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
    console.log("No new result");
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

  async fetch(request, env) {

    try {

      if (request.method !== "POST") {
        return new Response("OK");
      }


      const update = await request.json();


      console.log(
        "TELEGRAM UPDATE:",
        JSON.stringify(update)
      );


      // /register

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



      // /live

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


      return new Response("OK");


    } catch (error) {


      console.log(
        "WEBHOOK ERROR:",
        error
      );


      return new Response(
        "OK",
        {
          status: 200
        }
      );

    }

  },


  async scheduled(event, env, ctx) {

    try {

      const result = await autoPost(env);

      console.log(
        "CRON RESULT:",
        result
      );


    } catch (error) {

      console.log(
        "AUTO POST ERROR:",
        error
      );

    }

  }

};
