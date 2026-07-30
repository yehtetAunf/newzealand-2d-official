export async function createPoster(
  backgroundUrl,
  date,
  time,
  result
) {
  if (!backgroundUrl) {
    throw new Error("POSTER_BACKGROUND_URL is missing");
  }

  // Background URL ကို စစ်ဆေးပါ
  try {
    new URL(backgroundUrl);
  } catch {
    throw new Error("Invalid POSTER_BACKGROUND_URL");
  }

  return {
    // Telegram ကို SVG မပို့တော့ဘဲ
    // မူလ JPG/PNG image URL ကိုပဲ ပို့မယ်
    photo: backgroundUrl,

    // Date / Time / Result ကို Caption အနေနဲ့ ထည့်မယ်
    caption: `📅 ${date}
⏰ ${time}

🎯 Result: ${result}`,
  };
}
