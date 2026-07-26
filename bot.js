export default {
  async fetch(request) {
    return new Response("New Zealand 2D Bot Ready", {
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }
};
