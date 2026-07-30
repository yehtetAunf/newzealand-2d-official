export async function createPoster(
  backgroundUrl,
  date,
  time,
  result
) {
  if (!backgroundUrl) {
    throw new Error("POSTER_BACKGROUND_URL is missing");
  }

  try {
    new URL(backgroundUrl);
  } catch {
    throw new Error("Invalid POSTER_BACKGROUND_URL");
  }

  return {
    photo: backgroundUrl,

    caption: `📅 ${date}
⏰ ${time}

🎯 Result: ${result}`,
  };
}
