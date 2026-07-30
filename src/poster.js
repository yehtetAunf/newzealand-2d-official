export async function createPoster(
  backgroundUrl,
  date,
  time,
  result
) {
  if (!backgroundUrl) {
    throw new Error("POSTER_BACKGROUND_URL is missing");
  }

  const safeDate = escapeXml(date);
  const safeTime = escapeXml(time);
  const safeResult = escapeXml(result);

  const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="1080"
  height="1080"
  viewBox="0 0 1080 1080"
>
  <image
    href="${escapeXml(backgroundUrl)}"
    x="0"
    y="0"
    width="1080"
    height="1080"
    preserveAspectRatio="xMidYMid slice"
  />

  <rect
    x="50"
    y="760"
    width="980"
    height="260"
    rx="30"
    fill="#000000"
    fill-opacity="0.65"
  />

  <text
    x="90"
    y="825"
    fill="#ffffff"
    font-size="42"
    font-family="Arial, sans-serif"
    font-weight="bold"
  >
    ${safeDate}
  </text>

  <text
    x="90"
    y="890"
    fill="#ffffff"
    font-size="42"
    font-family="Arial, sans-serif"
    font-weight="bold"
  >
    ${safeTime}
  </text>

  <text
    x="90"
    y="970"
    fill="#ffffff"
    font-size="58"
    font-family="Arial, sans-serif"
    font-weight="bold"
  >
    Result: ${safeResult}
  </text>
</svg>
`;

  return {
    photo: new Blob(
      [svg],
      {
        type: "image/svg+xml",
      }
    ),

    caption: `📅 ${date}
⏰ ${time}

🎯 Result: ${result}`,
  };
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
