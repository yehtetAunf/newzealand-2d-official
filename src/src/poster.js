export async function createPoster(
  backgroundUrl,
  date,
  time,
  result
) {

  return {
    photo: backgroundUrl,
    caption:
`📅 ${date}
⏰ ${time}

🎯 Result: ${result}`
  };

}
