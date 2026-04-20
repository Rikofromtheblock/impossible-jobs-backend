import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import { initDb, getDb } from "./db/index.js";
import matchRouter from "./routes/match.js";
import previewRouter from "./routes/preview.js";
import missionsRouter from "./routes/missions.js";
import { generateWeeklyMissions } from "./jobs/generateMissions.js";

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json({ limit: "16kb" }));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "too many requests" },
});

app.use("/api/match",    aiLimiter, matchRouter);
app.use("/api/preview",  aiLimiter, previewRouter);
app.use("/api/missions", missionsRouter);

app.get("/health", (_, res) => res.json({ status: "ok", ts: Date.now() }));

app.post("/api/admin/generate", async (req, res) => {
  if (req.headers["x-admin-secret"] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "unauthorised" });
  }
  try {
    const count = await generateWeeklyMissions();
    res.json({ ok: true, generated: count });
  } catch (err) {
    console.error("Manual generate failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use((_, res) => res.status(404).json({ error: "not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "server error" });
});

initDb();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`impossible jobs backend running on :${PORT}`);

  cron.schedule("5 0 * * 1", async () => {
    console.log("⏰ Monday cron — generating new missions");
    try { await generateWeeklyMissions(); }
    catch (err) { console.error("Weekly generation failed:", err.message); }
  }, { timezone: "UTC" });

  setTimeout(async () => {
    try {
      const db    = getDb();
      const count = db.prepare("SELECT COUNT(*) as n FROM missions WHERE active = 1").get();
      if (count.n === 0) {
        console.log("📭 No missions found — generating initial batch...");
        await generateWeeklyMissions();
      } else {
        console.log(`📬 ${count.n} active missions in DB`);
      }
    } catch (e) {
      console.error("First-boot check failed:", e.message);
    }
  }, 3000);
});
