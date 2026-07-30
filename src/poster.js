export async function createPoster(
  backgroundUrl,
  date,
  time,
  result
) {
  if (!backgroundUrl) {
    throw new Error("POSTER_BACKGROUND_URL is missing");
  }

  const url = new URL(backgroundUrl);

  // Cloudflare Image Transformations
  // GitHub Raw image ကို Cloudflare zone ကနေ transform လုပ်မယ်
  const transformedUrl =
    `https://newzealand2d.com/cdn-cgi/image/width=1080,height=1080,fit=cover,format=png/${url.href}`;

  return {
    photo: transformedUrl,

    caption: `📅 ${date}
⏰ ${time}

🎯 Result: ${result}`,
  };
}
