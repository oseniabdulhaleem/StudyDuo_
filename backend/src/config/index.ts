import dotenv from "dotenv";
dotenv.config();

export const config = {
  bucket: process.env.BUCKET_NAME as string,
  projectId: process.env.GCP_PROJECT_ID as string,
  credentials: JSON.parse(process.env.GCP_CREDENTIALS || "{}"),
  geminiApiKey: process.env.GEMINI_API_KEY as string,
} as const;
