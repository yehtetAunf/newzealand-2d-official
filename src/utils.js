export function getMyanmarTime() {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Yangon"
  });
}

export function formatResult(date, time, result) {
  return `
🇳🇿 New Zealand 2D Result

🗓 ${date}
🕐 ${time}

🎯 Result - ${result}

ကော်စား စုံစမ်းရန် 👇🏻👇🏻
@NewZealand2D2026

NewZealand 2D Live_Botကြည့်ရန်
👉🏻👉🏻 @newzealand2dofficial_bot

✅ Good Luck Everyone

@JoinChannel
`;
}
