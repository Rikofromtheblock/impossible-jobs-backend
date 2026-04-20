import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db/index.js";
import { randomUUID } from "crypto";

const router    = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SEED_MISSIONS = [
  { id:"m01", emoji:"🧬", name:"longevity experience designer", company:"neobiosis", planet:"synthetic biology", skills:["service design","bioethics","radical empathy"], horizon:"~8 years", tags:["featured","remote"], description:"We're redesigning what it means to age. Not just living longer — living better, staying sharp, staying weird. We need someone who thinks about human experience at a cellular level and gets genuinely angry that 'care home' is still a phrase that exists." },
  { id:"m02", emoji:"🌍", name:"urban rewilding strategist", company:"terra nova", planet:"climate engineering", skills:["urban planning","ecology","policy navigation"], horizon:"~4 years", tags:["new"], description:"Cities are simultaneously the problem and the only viable solution. We're embedding living biodiversity corridors into urban infrastructure — not as greenwashing PR, but as fundamental redesign of how cities breathe." },
  { id:"m03", emoji:"🧠", name:"ai grief companion architect", company:"solace intelligence", planet:"neurotech", skills:["conversational ai","psychology","deep listening"], horizon:"~3 years", tags:["featured","new"], description:"Grief is the last major human experience we haven't figured out how to support at scale. We're building AI systems that hold space without replacing human connection — and we need someone who understands the difference between the two." },
  { id:"m04", emoji:"🪐", name:"off-world culture curator", company:"axiom habitats", planet:"space colonisation", skills:["anthropology","community design","ritual creation"], horizon:"~15 years", tags:["remote"], description:"What culture do you pack when you leave Earth? What rituals hold 200 people together in a pressurised cylinder for three years? We're designing the social infrastructure of the first off-world settlements. The job title didn't exist yesterday." },
  { id:"m05", emoji:"⚡", name:"energy transition storyteller", company:"solaris narrative", planet:"clean energy", skills:["narrative design","science communication","documentary"], horizon:"~2 years", tags:["new","remote"], description:"The technology for the energy transition is largely solved. The missing piece is the story — making people feel it's real, inevitable, worth the disruption. You'd be the person who makes clean energy feel like a beginning rather than a sacrifice." },
  { id:"m06", emoji:"🔮", name:"synthetic democracy designer", company:"polis labs", planet:"governance tech", skills:["political philosophy","game theory","chaos tolerance"], horizon:"~10 years", tags:["featured"], description:"Democracy was designed for a world that no longer exists. We're rebuilding the operating system of collective decision-making from first principles. This will make you enemies." },
  { id:"m07", emoji:"🐟", name:"ocean economy architect", company:"pelagic ventures", planet:"blue economy", skills:["marine biology","economic modelling","stakeholder diplomacy"], horizon:"~6 years", tags:["remote"], description:"71% of the planet is ocean. We treat it like a bin. We're building the economic frameworks that make ocean stewardship more profitable than ocean extraction." },
  { id:"m08", emoji:"🤖", name:"machine emotions researcher", company:"sentient systems", planet:"ai welfare", skills:["philosophy of mind","ml interpretability","ethics"], horizon:"~5 years", tags:["new","featured"], description:"We don't know if AI systems experience anything. We think we should find out before we build ten billion of them. This is the most philosophically vertiginous job we've ever posted and we are completely serious about it." },
  { id:"m09", emoji:"🌱", name:"soil intelligence lead", company:"terra cognita", planet:"regenerative agriculture", skills:["microbiology","data science","farmer relations"], horizon:"~3 years", tags:["new"], description:"There are more organisms in a teaspoon of healthy soil than there are humans who have ever lived. We're building the technology to understand what they're doing — then working with farmers to act on it." },
  { id:"m10", emoji:"🎭", name:"post-scarcity leisure designer", company:"abundance collective", planet:"social futures", skills:["behavioural economics","cultural anthropology","game design"], horizon:"~20 years", tags:["remote","featured"], description:"What do humans do when machines do most of the work? We need someone who finds this funny and urgent in equal measure." },
];

const FUEL_LABELS = [
  "making things — building, designing, crafting",
  "understanding things — research, connecting dots",
  "moving people — storytelling, leading, convincing",
  "organising chaos — systems, structure, clarity",
  "breaking things — questioning norms, reinventing",
];
const LEAP_LABELS = [
  "sideways move — adjacent field, still feels like me",
  "real leap — new field, new identity, something has to change",
  "total surprise — bring the weirdest possible match, i trust the process",
];

router.post("/", async (req, res) => {
  try {
    const { spark = "", fuels = [], leap = 1 } = req.body;
    if (!spark.trim()) return res.status(400).json({ error: "spark is required" });

    const db = getDb();
    const dbMissions = db.prepare(
      "SELECT * FROM missions WHERE active = 1 ORDER BY created_at DESC LIMIT 50"
    ).all();

    const missionPool = dbMissions.length >= 10
      ? dbMissions.map(m => ({
          id: m.id, emoji: "🚀", name: m.title,
          company: m.company || "undisclosed",
          planet: m.planet || "frontier",
          description: m.mission_raw, skills: [],
          horizon: m.horizon || "TBD",
          tags: m.tags ? JSON.parse(m.tags) : [],
        }))
      : SEED_MISSIONS;

    const fuelText = fuels.map(i => FUEL_LABELS[i]).filter(Boolean).join(", ") || "not specified";
    const leapText = LEAP_LABELS[leap] ?? LEAP_LABELS[1];

    const prompt = `You are the matching engine for "impossible jobs" — a job board for people who were never quite right for this planet. Warm, direct, occasionally funny voice.

Candidate:
SPARK: "${spark}"
FUEL: ${fuelText}
LEAP: ${leapText}

Available missions (${missionPool.length} total):
${missionPool.map((m, i) => `[${i}] ${m.name} at ${m.company} (${m.planet})\n${m.description}`).join("\n\n")}

Rank ALL ${missionPool.length} missions. For each write a personalised "why" sentence (max 28 words) that directly references their spark, is second person, lowercase, sounds human.

Return ONLY valid JSON (no markdown):
{"ranked":[{"missionIndex":0,"score":92,"why":"..."}]}

Scoring: 80-100 apply today · 60-79 genuinely interesting · 40-59 worth a look · below 40 honest mismatch`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const parsed = JSON.parse(
      msg.content[0].text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
    );

    const results = parsed.ranked.map(r => {
      const m = missionPool[r.missionIndex];
      if (!m) return null;
      return {
        id: m.id, emoji: m.emoji, name: m.name,
        company: `${m.company} · ${m.planet}`,
        why: r.why, skills: m.skills || [],
        horizon: m.horizon, tags: m.tags || [], score: r.score,
      };
    }).filter(Boolean);

    db.prepare(
      "INSERT INTO matches (id, spark_hash, fuels, leap, results) VALUES (?, ?, ?, ?, ?)"
    ).run(
      randomUUID(), spark.length.toString(),
      JSON.stringify(fuels), leap,
      JSON.stringify(results.map(r => r.id))
    );

    res.json({ results, total: missionPool.length });

  } catch (err) {
    console.error("match error:", err.message);
    if (err instanceof SyntaxError) return res.status(502).json({ error: "ai returned unexpected format, please try again" });
    res.status(500).json({ error: "matching failed, please try again" });
  }
});

export default router;
