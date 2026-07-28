export async function sendMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    })
  });

  return await response.json();
}


export async function sendPhoto(token, chatId, photo, caption = "") {
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photo,
      caption: caption,
      parse_mode: "HTML"
    })
  });

  return await response.json();
}
