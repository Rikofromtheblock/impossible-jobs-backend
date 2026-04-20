import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initDb } from "./db/index.js";
import matchRouter from "./routes/match.js";
import previewRouter from "./routes/preview.js";
import missionsRouter from "./routes/missions.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: "*", methods: ["GET","POST"] }));
app.use(express.json({ limit: "16kb" }));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "too many requests" },
});

app.use("/api/match",    aiLimiter, matchRouter);
app.use("/api/preview",  aiLimiter, previewRouter);
app.use("/api/missions", missionsRouter);

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use((_, res) => res.status(404).json({ error: "not found" }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: "server error" }); });

initDb();
app.listen(PORT, "0.0.0.0", () => console.log(`running on ${PORT}`));
