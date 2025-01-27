// src/services/storage.ts
import { config } from "../config/index.js";
import { GoogleAuth } from "google-auth-library";
import { Storage } from "@google-cloud/storage";

const auth = new GoogleAuth({
  scopes: [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/devstorage.full_control",
  ],
});

export const bucket = new Storage({
  authClient: auth,
}).bucket(config.bucket);

// {
//   projectId: config.projectId,
//   //   credentials: config.credentials,
// }
