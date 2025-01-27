import express from "express";
import cors from "cors";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import revisionRoutes from "./routes/revision.js";
import { authMiddleware } from "./middleware/auth.js";
import { appRouter } from "./server/routers/_app";
import { createContext } from "./server/context";
import creditRoutes from "./routes/credit"

const upload = multer();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());
app.use(
  // cors({
  //   origin:  "http://localhost:3000", // Your frontend URL
  //   credentials: true,
  // })
  cors()
);

app.use(
  "/api/revisions",
  (req, res, next) => {
    if (req.method === "POST") {
      return upload.array("files")(req, res, next);
    }
    next();
  },
  authMiddleware,
  revisionRoutes
);

// Credit routes - removed unnecessary file upload middleware
app.use("/api/credits", authMiddleware, creditRoutes);

// tRPC endpoint
app.use(
  "/api/trpc",
  authMiddleware,
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.listen(5000, () => console.log("Server running on port 5000"));
