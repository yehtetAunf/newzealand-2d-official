export async function createPoster(
  backgroundUrl,
  date,
  time,
  result
) {
  if (!backgroundUrl) {
    throw new Error("POSTER_BACKGROUND_URL is missing");
  }

  return {
    // မူလ JPG ပုံကိုပဲ Telegram ဆီပို့မယ်
    photo: backgroundUrl,

    caption: `📅 ${date}
⏰ ${time}

🎯 Result: ${result}`,
  };
}
