// ===== File: src/index.js =====

import { createPoster } from "./poster.js";

const STATE_API_URL =
  "https://newzealand2d.com/api/state";

const CHANNELS_KEY =
  "telegram_channels";

// ===== Helper: Fetch Live State =====
async function fetchLiveState() {
  try {
    console.log(
      "[fetchLiveState] API URL:",
      STATE_API_URL
    );

    const res =
      await fetch(STATE_API_URL);

    console.log(
      "[fetchLiveState] Status:",
      res.status
    );

    if (!res.ok) {
      throw new Error(
        `API request failed: ${res.status} ${res.statusText}`
      );
    }

    const data =
      await res.json();

    console.log(
      "[fetchLiveState] Success:",
      JSON.stringify(data)
    );

    return data;
  } catch (e) {
    console.log(
      "[fetchLiveState] Error:",
      e?.message || e
    );

    return null;
  }
}

// ===== Get Registered Channels =====
async function getChannels(env) {
  if (!env.DB) {
    throw new Error(
      "DB KV binding is missing"
    );
  }

  const raw =
    await env.DB.get(
      CHANNELS_KEY
    );

  if (!raw) {
    return [];
  }

  try {
    const channels =
      JSON.parse(raw);

    if (!Array.isArray(channels)) {
      return [];
    }

    return channels;
  } catch (error) {
    console.log(
      "[Channels] Invalid KV data:",
      error?.message || error
    );

    return [];
  }
}

// ===== Save Channels =====
async function saveChannels(
  env,
  channels
) {
  await env.DB.put(
    CHANNELS_KEY,
    JSON.stringify(channels)
  );
}

// ===== Add Channel =====
async function addChannel(
  env,
  chatId
) {
  const channels =
    await getChannels(env);

  const id =
    String(chatId);

  if (
    channels.includes(id)
  ) {
    return false;
  }

  channels.push(id);

  await saveChannels(
    env,
    channels
  );

  return true;
}

// ===== Remove Channel =====
async function removeChannel(
  env,
  chatId
) {
  const channels =
    await getChannels(env);

  const id =
    String(chatId);

  const newChannels =
    channels.filter(
      (channelId) =>
        channelId !== id
    );

  if (
    newChannels.length ===
    channels.length
  ) {
    return false;
  }

  await saveChannels(
    env,
    newChannels
  );

  return true;
}

// ===== Telegram Request =====
async function telegramRequest(
  env,
  method,
  data = {}
) {
  if (!env.BOT_TOKEN) {
    throw new Error(
      "BOT_TOKEN is missing"
    );
  }

  const response =
    await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(data),
      }
    );

  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      `Telegram API invalid response: ${response.status}`
    );
  }

  console.log(
    `[Telegram ${method}]`,
    JSON.stringify(result)
  );

  if (
    !response.ok ||
    result.ok !== true
  ) {
    throw new Error(
      `Telegram ${method} failed: ${
        result.description ||
        "Unknown error"
      }`
    );
  }

  return result;
}

// ===== Telegram Send Message =====
async function telegramSendMessage(
  env,
  chatId,
  text
) {
  return telegramRequest(
    env,
    "sendMessage",
    {
      chat_id:
        String(chatId),
      text:
        String(text),
    }
  );
}

// ===== Telegram Send Photo =====
async function telegramSendPhoto(
  env,
  chatId,
  photo,
  caption = ""
) {
  if (!photo) {
    throw new Error(
      "Photo is missing"
    );
  }

  const form =
    new FormData();

  form.append(
    "chat_id",
    String(chatId)
  );

  if (
    photo instanceof Blob
  ) {
    form.append(
      "photo",
      photo,
      "poster.jpg"
    );
  } else if (
    photo instanceof ArrayBuffer
  ) {
    const blob =
      new Blob(
        [photo],
        {
          type:
            "image/jpeg",
        }
      );

    form.append(
      "photo",
      blob,
      "poster.jpg"
    );
  } else if (
    typeof photo ===
    "string"
  ) {
    form.append(
      "photo",
      photo
    );
  } else {
    throw new Error(
      `Unsupported photo type: ${
        Object.prototype.toString.call(
          photo
        )
      }`
    );
  }

  if (caption) {
    form.append(
      "caption",
      String(caption)
    );
  }

  const response =
    await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: form,
      }
    );

  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      `Telegram sendPhoto failed: ${response.status} - Invalid JSON response`
    );
  }

  console.log(
    "[Telegram sendPhoto]",
    JSON.stringify(result)
  );

  if (
    !response.ok ||
    result.ok !== true
  ) {
    throw new Error(
      `Telegram sendPhoto failed: ${response.status} - ${
        result.description ||
        "Unknown Telegram error"
      }`
    );
  }

  return result;
}

// ===== Duplicate Check =====
async function isDuplicate(
  env,
  key
) {
  if (!env.DB) {
    throw new Error(
      "DB KV binding is missing"
    );
  }

  const last =
    await env.DB.get(
      "last_post"
    );

  if (last === key) {
    console.log(
      "No new published result"
    );

    return true;
  }

  await env.DB.put(
    "last_post",
    key
  );

  return false;
}

// ===== Auto Post Logic =====
async function handleAutoPost(
  env
) {
  console.log(
    "[AutoPost] Checking live state..."
  );

  const state =
    await fetchLiveState();

  if (!state) {
    return "No state";
  }

  const rounds =
    Array.isArray(
      state.rounds
    )
      ? state.rounds
      : [];

  const publishedRounds =
    rounds.filter(
      (round) =>
        round &&
        round.status ===
          "published" &&
        round.result &&
        round.result !==
          "--"
    );

  if (
    publishedRounds.length ===
    0
  ) {
    console.log(
      "No published result"
    );

    return "No new result";
  }

  const latestRound =
    publishedRounds[
      publishedRounds.length -
        1
    ];

  const result =
    String(
      latestRound.result
    );

  const time =
    latestRound.time ||
    "";

  const date =
    state.date ||
    new Date()
      .toISOString()
      .slice(0, 10);

  const uniqueKey =
    `${date}-${time}-${result}`;

  const duplicate =
    await isDuplicate(
      env,
      uniqueKey
    );

  if (duplicate) {
    return "No new result";
  }

  console.log(
    "[AutoPost] New published result:",
    {
      date,
      time,
      result,
    }
  );

  // ===== Create Poster =====
  const poster =
    await createPoster(
      env.SCREENSHOT_API_KEY,
      date,
      time,
      result
    );

  if (
    !poster ||
    !poster.photo
  ) {
    throw new Error(
      "Poster photo is missing"
    );
  }

  // ===== Get All Channels =====
  const channels =
    await getChannels(env);

  if (
    channels.length ===
    0
  ) {
    console.log(
      "[AutoPost] No registered channels"
    );

    return "No channels";
  }

  console.log(
    "[AutoPost] Sending to channels:",
    channels
  );

  // ===== Send To All Channels =====
  for (
    const channelId of channels
  ) {
    try {
      await telegramSendPhoto(
        env,
        channelId,
        poster.photo,
        poster.caption
      );

      console.log(
        `[AutoPost] Posted to ${channelId}`
      );
    } catch (error) {
      console.log(
        `[AutoPost] Failed ${channelId}:`,
        error?.message ||
          error
      );
    }
  }

  return "Posted";
}

// ===== Telegram Command Handler =====
async function handleTelegramUpdate(
  env,
  update
) {
  const message =
    update?.message;

  if (!message) {
    return;
  }

  const text =
    message.text || "";

  const chat =
    message.chat;

  if (!chat?.id) {
    return;
  }

  const chatId =
    String(chat.id);

  // /addchannel
  if (
    text.trim() ===
    "/addchannel"
  ) {
    const added =
      await addChannel(
        env,
        chatId
      );

    if (added) {
      await telegramSendMessage(
        env,
        chatId,
        "✅ ဒီ Channel ကို Result Auto Post စာရင်းထဲ ထည့်ပြီးပါပြီ။"
      );
    } else {
      await telegramSendMessage(
        env,
        chatId,
        "ℹ️ ဒီ Channel က စာရင်းထဲမှာ ရှိပြီးသားပါ။"
      );
    }

    return;
  }

  // /removechannel
  if (
    text.trim() ===
    "/removechannel"
  ) {
    const removed =
      await removeChannel(
        env,
        chatId
      );

    if (removed) {
      await telegramSendMessage(
        env,
        chatId,
        "🗑️ ဒီ Channel ကို Auto Post စာရင်းကနေ ဖယ်ပြီးပါပြီ။"
      );
    } else {
      await telegramSendMessage(
        env,
        chatId,
        "ℹ️ ဒီ Channel က စာရင်းထဲမှာ မရှိပါ။"
      );
    }

    return;
  }

  // /channels
  if (
    text.trim() ===
    "/channels"
  ) {
    const channels =
      await getChannels(env);

    if (
      channels.length ===
      0
    ) {
      await telegramSendMessage(
        env,
        chatId,
        "📭 Auto Post Channel မရှိသေးပါ။"
      );
    } else {
      await telegramSendMessage(
        env,
        chatId,
        `📢 Registered Channels:\n\n${channels.join(
          "\n"
        )}`
      );
    }

    return;
  }
}

// ===== Worker =====
export default {
  async fetch(
    request,
    env,
    ctx
  ) {
    const url =
      new URL(
        request.url
      );

    // Telegram Webhook
    if (
      request.method ===
        "POST" &&
      url.pathname ===
        "/telegram-webhook"
    ) {
      try {
        const update =
          await request.json();

        await handleTelegramUpdate(
          env,
          update
        );

        return new Response(
          "OK"
        );
      } catch (error) {
        console.log(
          "[Webhook Error]:",
          error?.message ||
            error
        );

        return new Response(
          "Webhook error",
          {
            status: 500,
          }
        );
      }
    }

    return new Response(
      "Worker running..."
    );
  },

  async scheduled(
    event,
    env,
    ctx
  ) {
    ctx.waitUntil(
      handleAutoPost(env).catch(
        (error) => {
          console.log(
            "[scheduled] Auto post error:",
            error?.message ||
              error
          );
        }
      )
    );
  },
};
