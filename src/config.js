/**
 * New Zealand 2D Bot Configuration
 * Version: 2.0
 */

export const CONFIG = {
  // Bot
  BOT_NAME: "New Zealand 2D Official Bot",
  BOT_VERSION: "2.0.0",

  // Time
  TIMEZONE: "Asia/Yangon",
  CRON_INTERVAL: "*/1 * * * *",

  // Database
  LAST_RESULT_KEY: "last_result",

  // Telegram
  PARSE_MODE: "HTML",

  // API
  API_TIMEOUT: 10000,

  // Features
  FEATURES: {
    AUTO_POST: true,
    AUTO_REPLY: true,
    BROADCAST: true,
    HISTORY: true,
    CALENDAR: true
  }
};
