export async function createPoster(
  backgroundUrl,
  date,
  time,
  result
) {
  const response = await fetch(backgroundUrl);

  if (!response.ok) {
    throw new Error(
      `Poster background fetch failed: ${response.status}`
    );
  }

  const imageBuffer = await response.arrayBuffer();

  // Cloudflare Worker မှာ Image Transform မသုံးဘဲ
  // မူလပုံကို Telegram ဆီပို့ပြီး Caption ထဲမှာ
  // Date / Time / Result ထည့်ပေးမယ့်ပုံစံ
  //
  // သတိပြုရန်:
  // Cloudflare Worker ရဲ့ ပုံပေါ်မှာ စာသားကို တကယ်ရေးဖို့
  // ImageMagick / Sharp လို image processing library
  // လိုအပ်ပါတယ်။ Worker ထဲမှာ တိုက်ရိုက် canvas မရနိုင်တဲ့အတွက်
  // ဒီ function က လက်ရှိအတိုင်း background ပုံကိုပဲ ပြန်ပေးထားပါတယ်။

  return {
    photo: new Blob([imageBuffer], {
      type: response.headers.get("content-type") || "image/jpeg",
    }),

    caption: `📅 ${date}
⏰ ${time}

🎯 Result: ${result}`,
  };
}
