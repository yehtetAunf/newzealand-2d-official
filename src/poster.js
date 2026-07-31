const APP_URL = "https://newzealand2d.com/app";

export async function createPoster(
  screenshotApiKey,
  date,
  time,
  result
) {
  if (!screenshotApiKey) {
    throw new Error("SCREENSHOT_API_KEY is missing");
  }

  const screenshotUrl =
    "https://api.screenshotone.com/take?" +
    new URLSearchParams({
      access_key: screenshotApiKey,
      url: APP_URL,
      format: "jpg",
      response_type: "by_format",
      full_page: "false",
      delay: "1",
      block_ads: "true",
      block_cookie_banners: "true"
    }).toString();

  return {
    photo: screenshotUrl,
    caption: `📅 ${date}
⏰ ${time}

🎯 Result: ${result}`
  };
}
