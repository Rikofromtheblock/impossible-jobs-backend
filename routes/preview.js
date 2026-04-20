import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post("/", async (req, res) => {
  try {
    const { missionText = "", mindText = "", horizon = "", planet = "" } = req.body;
    if (!missionText.trim() || !mindText.trim()) {
      return res.status(400).json({ error: "mission and mind fields are required" });
    }

    const prompt = `You are writing a mission brief for "impossible jobs" — a job board that rejects traditional hiring.

The company says:
MISSION: "${missionText}"
MIND NEEDED: "${mindText}"
HORIZON: "${horizon || "not specified"}"
PLANET (domain): "${planet || "not specified"}"

Write a compelling mission brief. Rules:
- Everything lowercase
- No corporate language — write like talking to a brilliant friend
- Short paragraphs, max 3 sentences each
- Make the right person feel seen, wrong person self-select out
- No qualifications, years of experience, or CVs

Return ONLY valid JSON:
{
  "title": "short evocative mission title (4-7 words, lowercase)",
  "brief": "2-3 short paragraphs about the mission and why it matters",
  "mind": "1-2 sentences on instincts and obsessions needed, not qualifications",
  "horizon": "one sentence on timing and stakes",
  "tags": ["tag1","tag2","tag3","tag4"],
  "whyNow": "one sentence on why this moment matters"
}`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role:"user", content:prompt }],
    });

    const preview = JSON.parse(
      msg.content[0].text.trim().replace(/^```json\n?/,"").replace(/\n?```$/,"")
    );

    res.json({ preview });
  } catch(err) {
    console.error("preview error:", err);
    res.status(500).json({ error: "preview failed, please try again" });
  }
});

export default router;
