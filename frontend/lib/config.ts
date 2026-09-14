const rawBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
