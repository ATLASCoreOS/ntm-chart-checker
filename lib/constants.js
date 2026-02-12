export const BASE_URL = "https://msi.admiralty.co.uk";
export const WEEKLY_PAGE = "/NoticesToMariners/Weekly";
export const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// Retry & timeout settings for external fetches
export const MAX_RETRIES = 2;
export const RETRY_BASE_MS = 1000;
export const FETCH_TIMEOUT_MS = 20000;

// Application limits
export const MAX_CHARTS = 50;
export const COOLDOWN_SECONDS = 30;
export const HISTORY_PAGE_LIMIT = 50;
export const HISTORY_MAX_LIMIT = 100;
export const BCRYPT_ROUNDS = 12;
