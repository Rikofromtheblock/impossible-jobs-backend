import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db/index.js";
import { randomUUID } from "crypto";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateWeeklyMissions() {
  console.log("🚀 Generating weekly missions via Claude...");

  const prompt = `You write mission listings for "impossible jobs" — a job board for people who were never quite right for this planet.

Generate exactly 30 ORIGINAL mission listings. New companies, new problems, new domains every time.

Rules:
- Wildly varied domains — hard science, social systems, governance, arts, economics, ecology, space, health, education, food, language, sleep, memory, death, play, loneliness, beauty, money, music, animals, cities, time
- Credible — feel like real companies doing real unusual things
- Specific — precise about the actual problem, not vague innovation speak
- Occasionally dry-funny — "the job title didn't exist yesterday", "this will make you enemies", "we are completely serious about this"
- Lowercase throughout
- Mix of horizons: some urgent (1-2 years), some building (5-10), some visionary (15-20)
- name must NOT be a traditional job title — e.g. "grief infrastructure architect" not "senior manager"

Return ONLY valid JSON, no markdown:
{
  "missions": [
    {
      "emoji": "🧬",
      "name": "4-7 word mission title lowercase",
      "company": "invented company name lowercase",
      "planet": "1-3 word domain lowercase",
      "skills": ["skill one", "skill two", "skill three"],
      "horizon": "~X years",
      "tags": ["featured"],
      "description": "3-4 sentences. Specific about the problem. Warm and direct. Occasionally funny. No CVs, no qualifications. End on something that makes the right person lean forward."
    }
  ]
}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const raw    = msg.content[0].text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(raw);

  if (!parsed.missions || parsed.missions.length < 20) {
    throw new Error(`Only got ${parsed.missions?.length ?? 0} missions, expected 30`);
  }

  const db   = getDb();
  const week = getISOWeek();

  // Archive previous generated batch
  db.prepare("UPDATE missions SET active = 0 WHERE id LIKE 'gen-%'").run();

  const insert = db.prepare(`
    INSERT INTO missions (id, title, company, planet, mission_raw, mind_raw, horizon, tags, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  let count = 0;
  for (const m of parsed.missions.slice(0, 30)) {
    try {
      insert.run(
        `gen-${week}-${randomUUID().slice(0, 8)}`,
        (m.name || "untitled").toLowerCase().trim(),
        (m.company || "unknown").toLowerCase().trim(),
        (m.planet || "frontier").toLowerCase().trim(),
        m.description || "",
        `someone obsessed with ${m.planet} who finds this problem inescapable.`,
        m.horizon || "TBD",
        JSON.stringify(Array.isArray(m.tags) ? m.tags : []),
      );
      count++;
    } catch (e) {
      console.error("Insert error:", e.message);
    }
  }

  console.log(`✅ Generated ${count} new missions for ${week}`);
  return count;
}

function getISOWeek() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week  = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
