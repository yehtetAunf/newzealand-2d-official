export default {
  async fetch(request, env) {
    return new Response(
      "✅ New Zealand 2D Official Bot is running!",
      {
        headers: {
          "content-type": "text/plain; charset=UTF-8",
        },
      }
    );
  },
};
