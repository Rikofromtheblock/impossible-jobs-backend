import { Router } from "express";
import { getDb } from "../db/index.js";
import { randomUUID } from "crypto";

const router = Router();

router.get("/", (req, res) => {
  try {
    const missions = getDb()
      .prepare("SELECT * FROM missions WHERE active=1 ORDER BY created_at DESC LIMIT 50")
      .all();
    res.json({ missions: missions.map(m => ({
      id: m.id, title: m.title, company: m.company,
      planet: m.planet, brief: m.brief_ai || m.mission_raw,
      horizon: m.horizon, tags: m.tags ? JSON.parse(m.tags) : [],
    }))});
  } catch(err) {
    res.status(500).json({ error: "could not load missions" });
  }
});

router.post("/", (req, res) => {
  try {
    const { title, company, planet, missionText, mindText, horizon, briefAi, tags=[] } = req.body;
    if (!missionText?.trim() || !mindText?.trim()) {
      return res.status(400).json({ error: "mission and mind are required" });
    }
    const id = randomUUID();
    getDb().prepare(`
      INSERT INTO missions (id,title,company,planet,mission_raw,mind_raw,horizon,brief_ai,tags)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      id,
      (title || missionText.slice(0,60)).trim(),
      company?.trim()||null, planet?.trim()||null,
      missionText.trim(), mindText.trim(),
      horizon?.trim()||null, briefAi?.trim()||null,
      JSON.stringify(tags)
    );
    res.status(201).json({ id, message: "mission posted" });
  } catch(err) {
    res.status(500).json({ error: "could not post mission" });
  }
});

export default router;
