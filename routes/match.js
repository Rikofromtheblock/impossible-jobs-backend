import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db/index.js";
import { randomUUID } from "crypto";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SEED_MISSIONS = [
  { id:"m1", emoji:"🧬", name:"longevity experience designer", company:"neobiosis", planet:"synthetic biology", skills:["service design","bioethics","radical empathy"], horizon:"~8 years", tags:["featured","remote"], description:"We're redesigning what it means to age. Not just living longer — living better, staying curious, staying connected." },
  { id:"m2", emoji:"🌍", name:"urban rewilding strategist", company:"terra nova", planet:"climate engineering", skills:["urban planning","ecology","policy"], horizon:"~4 years", tags:["new"], description:"Cities are the problem and the solution. We're embedding biodiversity corridors into urban infrastructure." },
  { id:"m3", emoji:"🧠", name:"ai grief companion architect", company:"solace intelligence", planet:"neurotech", skills:["conversational ai","psychology","deep listening"], horizon:"~3 years", tags:["featured","new"], description:"Grief is the last human experience we haven't figured out how to support at scale." },
  { id:"m4", emoji:"🪐", name:"off-world culture curator", company:"axiom habitats", planet:"space colonisation", skills:["anthropology","community design","ritual making"], horizon:"~15 years", tags:["remote"], description:"What culture do you bring to Mars? We're designing the social infrastructure of the first off-world settlements." },
  { id:"m5", emoji:"⚡", name:"energy transition storyteller", company:"solaris narrative", planet:"clean energy", skills:["narrative design","science communication","documentary"], horizon:"~2 years", tags:["new","remote"], description:"The technology for the energy transition exists. The missing piece is narrative." },
  { id:"m6", emoji:"🔮", name:"synthetic democracy designer", company:"polis labs", planet:"governance tech", skills:["political philosophy","game theory","chaos tolerance"], horizon:"~10 years", tags:["featured"], description:"Democracy was designed for a world that no longer exists. We're rebuilding it from first principles." },
];

const FUEL_LABELS = [
  "making things — building, designing, crafting",
  "understanding things — research, connecting dots",
  "moving people — storytelling, leading, convincing",
  "organising chaos — systems, structure, clarity",
  "breaking things — questioning norms, reinventing",
];

const LEAP_LABELS = ["sideways move","real leap","total surprise — bring the weirdest match"];

router.post("/", async (req, res) => {
  try {
    const { spark = "", fuels = [], leap = 1 } = req.body;
    if (!spark.trim()) return res.status(400).json({ error: "spark is required" });

    const db = getDb();
    const dbMissions = db.prepare("SELECT * FROM missions WHERE active=1 ORDER BY created_at DESC LIMIT 20").all();
    const allMissions = [
      ...SEED_MISSIONS,
      ...dbMissions.map(m => ({ id:m.id, emoji:"🚀", name:m.title, company:m.company||"undisclosed", planet:m.planet||"frontier", description:m.mission_raw, skills:[], horizon:m.horizon||"TBD", tags:m.tags?JSON.parse(m.tags):[] })),
    ];

    const prompt = `You are the matching engine for "impossible jobs".
Candidate spark: "${spark}"
Fuel: ${fuels.map(i=>FUEL_LABELS[i]).filter(Boolean).join(", ")||"not specified"}
Leap: ${LEAP_LABELS[leap]||LEAP_LABELS[1]}

Missions:
${allMissions.map((m,i)=>`[${i}] ${m.name} @ ${m.company} (${m.planet}): ${m.description}`).join("\n")}

Rank all missions. For each write a personalised "why" sentence (max 25 words, lowercase, references their spark).
Return ONLY valid JSON: {"ranked":[{"missionIndex":0,"score":95,"why":"..."}]}`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role:"user", content:prompt }],
    });

    const parsed = JSON.parse(msg.content[0].text.trim().replace(/^```json\n?/,"").replace(/\n?```$/,""));

    const results = parsed.ranked.map(r => {
      const m = allMissions[r.missionIndex];
      if (!m) return null;
      return { id:m.id, emoji:m.emoji, name:m.name, company:`${m.company} · ${m.planet}`, why:r.why, skills:m.skills||[], horizon:m.horizon, tags:m.tags||[], score:r.score };
    }).filter(Boolean);

    db.prepare("INSERT INTO matches (id,spark_hash,fuels,leap,results) VALUES (?,?,?,?,?)").run(
      randomUUID(), spark.length.toString(), JSON.stringify(fuels), leap, JSON.stringify(results.map(r=>r.id))
    );

    res.json({ results });
  } catch(err) {
    console.error("match error:", err);
    res.status(500).json({ error: "matching failed, please try again" });
  }
});

export default router;
