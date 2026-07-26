import { config } from "./config.js";

export async function handleMessage(text) {
  const msg = text.trim().toLowerCase();

  if (msg === "/start") {
    return `🤖 ${config.BOT_NAME}

မင်္ဂလာပါ 👋
New Zealand 2D Official Bot မှ ကြိုဆိုပါတယ် 🇳🇿

📌 အသုံးပြုနိုင်သော Commands

/start - Bot စတင်ရန်
/help - အကူအညီ
/about - Bot အကြောင်း`;
  }

  if (msg === "/help") {
    return `📖 Help

/start - Bot စတင်ရန်
/about - Bot အကြောင်း

စာပို့ပြီးလည်း အသုံးပြုနိုင်ပါတယ်။`;
  }

  if (msg === "/about") {
    return `${config.BOT_NAME}
📺 Channel : ${config.CHANNEL}
🚀 Version : ${config.VERSION}`;
  }
if (msg === "/2d") {
  return `🎯 New Zealand 2D

📊 Live Result
⏰ Morning : -
⏰ Evening : -

🚧 Live API မချိတ်ရသေးပါ။`;
}
  if (msg === "hello" || msg === "hi") {
    return "👋 Hello! Welcome to New Zealand 2D Official Bot.";
  }

  // ဂဏန်းပေါင်း (ဥပမာ 60+78)
const match = msg.match(/^(\d+)\s*\+\s*(\d+)$/);

if (match) {
  const a = parseInt(match[1]);
  const b = parseInt(match[2]);
  const sum = a + b;

  return `🧮 Result

${a} + ${b} = ${sum}`;
}

return "📩 သင့်စာကို လက်ခံရရှိပါတယ်။";
}

