const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const APP_NAME = "AskDoc";
export const APP_DESCRIPTION =
  "AI-powered document Q&A — upload PDFs and ask questions.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export { MAX_FILE_SIZE };
