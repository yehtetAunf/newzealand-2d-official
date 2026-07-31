// ===== File: src/index.js =====

import { createPoster } from "./poster.js";

const STATE_API_URL = "https://newzealand2d.com/api/state";

const CHANNEL_ID = "@New_2d";

// ===== Helper: Fetch Live State =====
async function fetchLiveState() {
  try {
    console.log("[fetchLiveState] API URL:", STATE_API_URL);

    const res = await fetch(STATE_API_URL);

    console.log("[fetchLiveState] Status:", res.status);

    if (!res.ok) {
      throw new Error(
        `API request failed: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();

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

// ===== Telegram Send Photo =====
async function telegramSendPhoto(
  env,
  photo,
  caption = ""
) {
  if (!env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing");
  }

  if (!CHANNEL_ID) {
    throw new Error("Telegram channel ID is missing");
  }

  if (!photo) {
    throw new Error("Photo is missing");
  }

  const form = new FormData();

  form.append(
    "chat_id",
    String(CHANNEL_ID)
  );

  // ScreenshotOne က Blob ပြန်ပေးရင်
  // Telegram ကို File အဖြစ် upload လုပ်မယ်
  if (photo instanceof Blob) {
    form.append(
      "photo",
      photo,
      "poster.jpg"
    );
  } else if (photo instanceof ArrayBuffer) {
    const blob = new Blob(
      [photo],
      { type: "image/jpeg" }
    );

    form.append(
      "photo",
      blob,
      "poster.jpg"
    );
  } else if (typeof photo === "string") {
    // Telegram က URL ကို တိုက်ရိုက်ယူနိုင်တဲ့အခြေအနေ
    form.append(
      "photo",
      photo
    );
  } else {
    throw new Error(
      `Unsupported photo type: ${
        Object.prototype.toString.call(photo)
      }`
    );
  }

  if (caption) {
    form.append(
      "caption",
      String(caption)
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
    {
      method: "POST",
      body: form,
    }
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Telegram sendPhoto failed: ${response.status} - Invalid JSON response`
    );
  }

  console.log(
    "[Telegram] Response:",
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

// ===== Duplicate Check (KV) =====
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
    await env.DB.get("last_post");

  // အဲဒီ Result ကို တင်ပြီးသားဆိုရင်
  // ထပ်မတင်ဘူး
  if (last === key) {
    console.log(
      "No new published result"
    );

    return true;
  }

  // အသစ်ဖြစ်ရင် နောက်တစ်ခါ
  // duplicate မဖြစ်အောင် မှတ်ထားမယ်
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
    console.log(
      "[AutoPost] No state"
    );

    return "No state";
  }

  /*
   * API Response မှာ
   *
   * live: {
   *   result: "38",
   *   ...
   * }
   *
   * rounds: [
   *   {
   *     time: "09:00 AM",
   *     result: "03"
   *   }
   * ]
   *
   * ဆိုပြီး structure ဖြစ်နိုင်တဲ့အတွက်
   * published round ကို ရှာမယ်။
   */

  const rounds =
    Array.isArray(state.rounds)
      ? state.rounds
      : [];

  const publishedRounds =
    rounds.filter(
      (round) =>
        round &&
        round.status === "published" &&
        round.result &&
        round.result !== "--"
    );

  if (
    publishedRounds.length === 0
  ) {
    console.log(
      "No published result"
    );

    return "No new result";
  }

  // နောက်ဆုံး Published Result
  const latestRound =
    publishedRounds[
      publishedRounds.length - 1
    ];

  const result =
    String(latestRound.result);

  const time =
    latestRound.time ||
    "";

  const date =
    state.date ||
    new Date().toISOString().slice(0, 10);

  /*
   * Duplicate Key
   *
   * Date + Round Time + Result
   *
   * တူမှသာ duplicate ဖြစ်မယ်
   */
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

  // ===== Screenshot + Poster =====
  const poster =
    await createPoster(
      env.SCREENSHOT_API_KEY,
      date,
      time,
      result
    );

  if (!poster) {
    throw new Error(
      "createPoster returned empty result"
    );
  }

  if (!poster.photo) {
    throw new Error(
      "Poster photo is missing"
    );
  }

  console.log(
    "[AutoPost] Poster created"
  );

  // ===== Send Telegram =====
  await telegramSendPhoto(
    env,
    poster.photo,
    poster.caption
  );

  console.log(
    "[AutoPost] Telegram post complete"
  );

  return "Posted";
}

// ===== Worker =====
export default {
  async fetch(
    request,
    env,
    ctx
  ) {
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
            error?.message || error
          );
        }
      )
    );
  },
};
