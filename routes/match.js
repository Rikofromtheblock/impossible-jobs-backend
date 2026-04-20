import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db/index.js";
import { randomUUID } from "crypto";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALL_MISSIONS = [
  { id:"m01", emoji:"🧬", name:"longevity experience designer", company:"neobiosis", planet:"synthetic biology", skills:["service design","bioethics","radical empathy"], horizon:"~8 years", tags:["featured","remote"], description:"We're redesigning what it means to age. Not just living longer — living better, staying sharp, staying weird. We need someone who thinks about human experience at a cellular level and gets genuinely angry that 'care home' is still a phrase that exists." },
  { id:"m02", emoji:"🌍", name:"urban rewilding strategist", company:"terra nova", planet:"climate engineering", skills:["urban planning","ecology","policy navigation"], horizon:"~4 years", tags:["new"], description:"Cities are simultaneously the problem and the only viable solution. We're embedding living biodiversity corridors into urban infrastructure — not as greenwashing PR, but as fundamental redesign of how cities breathe." },
  { id:"m03", emoji:"🧠", name:"ai grief companion architect", company:"solace intelligence", planet:"neurotech", skills:["conversational ai","psychology","deep listening"], horizon:"~3 years", tags:["featured","new"], description:"Grief is the last major human experience we haven't figured out how to support at scale. We're building AI systems that hold space without replacing human connection — and we need someone who understands the difference between the two." },
  { id:"m04", emoji:"🪐", name:"off-world culture curator", company:"axiom habitats", planet:"space colonisation", skills:["anthropology","community design","ritual creation"], horizon:"~15 years", tags:["remote"], description:"What culture do you pack when you leave Earth? What rituals hold 200 people together in a pressurised cylinder for three years? We're designing the social infrastructure of the first off-world settlements. The job title didn't exist yesterday." },
  { id:"m05", emoji:"⚡", name:"energy transition storyteller", company:"solaris narrative", planet:"clean energy", skills:["narrative design","science communication","documentary"], horizon:"~2 years", tags:["new","remote"], description:"The technology for the energy transition is largely solved. The missing piece is the story — making people feel it's real, inevitable, worth the disruption. You'd be the person who makes clean energy feel like a beginning rather than a sacrifice." },
  { id:"m06", emoji:"🔮", name:"synthetic democracy designer", company:"polis labs", planet:"governance tech", skills:["political philosophy","game theory","chaos tolerance"], horizon:"~10 years", tags:["featured"], description:"Democracy was designed for a world that no longer exists — before the internet, before AI, before the collapse of institutional trust. We're rebuilding the operating system of collective decision-making from first principles. This will make you enemies." },
  { id:"m07", emoji:"🐟", name:"ocean economy architect", company:"pelagic ventures", planet:"blue economy", skills:["marine biology","economic modelling","stakeholder diplomacy"], horizon:"~6 years", tags:["remote"], description:"71% of the planet is ocean. We treat it like a bin. We're building the economic frameworks that make ocean stewardship more profitable than ocean extraction — which requires someone who understands both the biology and the balance sheet." },
  { id:"m08", emoji:"🤖", name:"machine emotions researcher", company:"sentient systems", planet:"ai welfare", skills:["philosophy of mind","ml interpretability","ethics"], horizon:"~5 years", tags:["new","featured"], description:"We don't know if AI systems experience anything. We think we should find out before we build ten billion of them. This is the most philosophically vertiginous job we've ever posted and we are completely serious about it." },
  { id:"m09", emoji:"🌱", name:"soil intelligence lead", company:"terra cognita", planet:"regenerative agriculture", skills:["microbiology","data science","farmer relations"], horizon:"~3 years", tags:["new"], description:"There are more organisms in a teaspoon of healthy soil than there are humans who have ever lived. We're building the technology to understand what they're doing and why — then working with farmers to act on it. Less glamorous than it sounds. More important." },
  { id:"m10", emoji:"🎭", name:"post-scarcity leisure designer", company:"abundance collective", planet:"social futures", skills:["behavioural economics","cultural anthropology","game design"], horizon:"~20 years", tags:["remote","featured"], description:"What do humans do when machines do most of the work? Not philosophically — but practically, what do you design for a species whose identity has been built around labour for ten thousand years? We need someone who finds this funny and urgent in equal measure." },
  { id:"m11", emoji:"🧪", name:"psychedelic therapy protocol designer", company:"liminal health", planet:"mental health", skills:["clinical psychology","protocol design","regulatory navigation"], horizon:"~4 years", tags:["new"], description:"The clinical evidence for psychedelic-assisted therapy is now overwhelming. The bottleneck is safe, scalable, legally navigable protocols for delivering it. We're designing those. The work is serious. The territory is strange. That's the point." },
  { id:"m12", emoji:"🏙️", name:"15-minute city implementer", company:"proxima urban", planet:"urban mobility", skills:["urban design","political negotiation","community organising"], horizon:"~5 years", tags:["featured"], description:"The 15-minute city is a solved design problem. The unsolved problem is implementation in cities that weren't designed for it, with residents who were told cars are freedom. We need someone who understands both the urbanism and the politics." },
  { id:"m13", emoji:"🦾", name:"augmentation ethics officer", company:"augmenta", planet:"human enhancement", skills:["bioethics","policy","public communication"], horizon:"~7 years", tags:["new","remote"], description:"We make physical and cognitive augmentations. We also genuinely believe someone needs to think hard about what we're doing and tell us when we're wrong. This is that person. They report directly to the CEO. They have real power to stop things." },
  { id:"m14", emoji:"🌊", name:"flood futures modeller", company:"dry ground analytics", planet:"climate adaptation", skills:["hydrological modelling","insurance systems","urban planning"], horizon:"~3 years", tags:["featured","new"], description:"A third of the world's major cities will be significantly affected by flooding by 2050. Nobody wants to say this out loud. We model it, price it, and help cities plan for it — which is apparently controversial. We need someone who is good at being right in uncomfortable rooms." },
  { id:"m15", emoji:"📡", name:"interspecies communication researcher", company:"babel bio", planet:"animal cognition", skills:["animal behaviour","linguistics","machine learning"], horizon:"~12 years", tags:["remote"], description:"We're using AI to decode the communicative patterns of cetaceans, corvids, and cephalopods. We don't know if it'll work. We think the question is so important it justifies the attempt. If you've spent years thinking about non-human minds, this is your calling." },
  { id:"m16", emoji:"🍄", name:"mycelium materials lead", company:"fungal futures", planet:"biomaterials", skills:["mycology","materials science","supply chain design"], horizon:"~4 years", tags:["new"], description:"Mycelium can replace plastic, leather, concrete, and styrofoam. We know this. The challenge is making it at scale, at cost, without it smelling weird. We need someone who is obsessed with the biology and not afraid of the supply chain." },
  { id:"m17", emoji:"🧒", name:"childhood redesign strategist", company:"futures school", planet:"education", skills:["developmental psychology","curriculum design","parent communication"], horizon:"~6 years", tags:["featured"], description:"We are still teaching children using methods designed for the industrial revolution. We're rebuilding education from the perspective of what children actually need to thrive in 2050. This involves a lot of telling powerful people they've been wrong for a century." },
  { id:"m18", emoji:"🏔️", name:"rewilding economics lead", company:"wild returns", planet:"conservation finance", skills:["conservation biology","financial modelling","land law"], horizon:"~5 years", tags:["remote","new"], description:"Rewilding works. The bottleneck is economic — it's currently more profitable to farm badly than to restore ecosystems brilliantly. We're fixing the economic model. This requires someone who can talk to both ecologists and hedge funds without losing their soul." },
  { id:"m19", emoji:"💊", name:"longevity drug trial designer", company:"chronos therapeutics", planet:"geroscience", skills:["clinical trial design","regulatory affairs","patient advocacy"], horizon:"~8 years", tags:["featured"], description:"We have twelve candidate compounds that appear to slow biological ageing in model organisms. Moving them to human trials requires someone who can navigate the regulatory framework while the regulatory framework works out what ageing even is as a disease." },
  { id:"m20", emoji:"🎵", name:"ai music rights philosopher", company:"harmonic futures", planet:"creative economy", skills:["intellectual property law","music theory","ai ethics"], horizon:"~2 years", tags:["new","remote"], description:"AI can now compose, perform, and produce music indistinguishable from human artists. Nobody has figured out what this means for ownership, royalties, or the soul of the thing. We need someone who cares deeply about both the law and the music." },
  { id:"m21", emoji:"🌡️", name:"heat death city planner", company:"cool cities lab", planet:"extreme climate adaptation", skills:["urban heat mitigation","architecture","materials science"], horizon:"~3 years", tags:["featured","new"], description:"By 2040, dozens of major cities will be functionally uninhabitable in summer without intervention. We're designing the interventions — shade infrastructure, cool corridors, building retrofits, water features. The job title is slightly bleak. The work is necessary." },
  { id:"m22", emoji:"🤝", name:"robot workforce transition designer", company:"labour futures institute", planet:"automation economics", skills:["labour economics","retraining programme design","political communication"], horizon:"~5 years", tags:["remote"], description:"Automation will displace between 20% and 40% of current jobs in the next decade. We're building the transition infrastructure — retraining, income support, new purpose frameworks. Not to soften the blow, but to make it a beginning." },
  { id:"m23", emoji:"🧘", name:"attention economy exit architect", company:"deep work foundation", planet:"cognitive health", skills:["product design","behavioural science","policy"], horizon:"~3 years", tags:["new","featured"], description:"We're building the tools, environments, and policy frameworks that make deep work possible in an age designed to prevent it. This is a genuinely adversarial project — the people whose business model we're disrupting are very good at what they do." },
  { id:"m24", emoji:"🏛️", name:"institutional trust rebuilder", company:"civic futures lab", planet:"social infrastructure", skills:["political science","community organising","communications"], horizon:"~10 years", tags:["featured"], description:"Trust in governments, media, science, and institutions has collapsed globally. We're not interested in PR fixes. We're redesigning the institutions themselves — their transparency, accountability, and feedback loops. This is slow, important, underrated work." },
  { id:"m25", emoji:"🦠", name:"pandemic preparedness architect", company:"sentinel health", planet:"global health security", skills:["epidemiology","supply chain resilience","international policy"], horizon:"~4 years", tags:["remote","new"], description:"Covid was not the worst pandemic we will face. We're building the early warning systems, stockpile infrastructure, and international coordination frameworks that mean the next one goes differently. The job is unglamorous. The stakes are not." },
  { id:"m26", emoji:"🎨", name:"human creativity augmentation lead", company:"muse systems", planet:"creative tools", skills:["creative practice","human-computer interaction","philosophy"], horizon:"~3 years", tags:["new","featured"], description:"Not replacing human creativity. Augmenting it — building tools that help humans make things they couldn't make alone, while keeping the human unmistakably in the work. This requires someone who has made things, not just thought about making things." },
  { id:"m27", emoji:"🌐", name:"digital commons architect", company:"commons protocol", planet:"internet infrastructure", skills:["distributed systems","governance design","economic modelling"], horizon:"~7 years", tags:["remote"], description:"The internet was designed as a commons and became an enclosure. We're building the technical and governance infrastructure for a new layer of the internet that can't be captured by platform monopolies. This is genuinely hard and the opposition is well-funded." },
  { id:"m28", emoji:"🐘", name:"megafauna rewilding coordinator", company:"pleistocene park foundation", planet:"ecological restoration", skills:["conservation biology","international relations","veterinary science"], horizon:"~15 years", tags:["remote","featured"], description:"We're reintroducing large animals to landscapes where they've been absent for centuries — and dealing with the ecological, political, and occasionally physical consequences. The work involves a lot of tranquiliser dart calculations and surprisingly heated town hall meetings." },
  { id:"m29", emoji:"💰", name:"wealth redistribution mechanism designer", company:"equity systems lab", planet:"economic design", skills:["tax policy","behavioural economics","political negotiation"], horizon:"~8 years", tags:["new"], description:"The mechanisms for redistributing wealth in most economies were designed before anyone imagined the kind of concentration we now have. We're designing new ones — practical, politically navigable, actually implementable. Not utopian. Just less broken." },
  { id:"m30", emoji:"🔬", name:"dark matter of biology researcher", company:"substrate labs", planet:"fundamental biology", skills:["molecular biology","computational biology","scientific writing"], horizon:"~10 years", tags:["featured","remote"], description:"95% of the human genome was labelled 'junk' and ignored for decades. It isn't junk. We're mapping what it actually does — which appears to include regulating almost everything we thought we understood. This is basic science with enormous downstream consequences." },
];

function getWeeklyMissions() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week  = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  const seed  = now.getFullYear() * 100 + week;
  const pool  = [...ALL_MISSIONS];
  let s = seed;
  for (let i = pool.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const featured = pool.filter(m => m.tags.includes("featured")).slice(0, 3);
  const rest     = pool.filter(m => !featured.includes(m)).slice(0, 9);
  return [...featured, ...rest];
}

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

    const weeklyMissions = getWeeklyMissions();
    const db             = getDb();
    const dbMissions     = db.prepare("SELECT * FROM missions WHERE active=1 ORDER BY created_at DESC LIMIT 10").all();

    const allMissions = [
      ...weeklyMissions,
      ...dbMissions.map(m => ({
        id: m.id, emoji: "🚀", name: m.title,
        company: m.company || "undisclosed",
        planet: m.planet || "frontier",
        description: m.mission_raw, skills: [],
        horizon: m.horizon || "TBD",
        tags: m.tags ? JSON.parse(m.tags) : [],
      })),
    ];

    const fuelText = fuels.map(i => FUEL_LABELS[i]).filter(Boolean).join(", ") || "not specified";
    const leapText = LEAP_LABELS[leap] ?? LEAP_LABELS[1];

    const prompt = `You are the matching engine for "impossible jobs" — a job board for people who were never quite right for this planet. Your voice is warm, direct, and occasionally funny. You take the matching seriously but not yourself.

Candidate:
SPARK: "${spark}"
FUEL: ${fuelText}
LEAP: ${leapText}

Available missions this week:
${allMissions.map((m, i) => `[${i}] ${m.name} at ${m.company} (${m.planet})\n${m.description}`).join("\n\n")}

Rank ALL ${allMissions.length} missions. For each write a "why" sentence (max 28 words) that:
- References their specific spark directly
- Is in second person, lowercase
- Sounds human, not algorithmic
- Is honest about weak matches — say so with warmth not apology

Return ONLY valid JSON (no markdown):
{"ranked":[{"missionIndex":0,"score":92,"why":"your obsession with X is almost exactly what this mission is made of."}]}

Scoring: 80-100 strong match · 60-79 interesting fit · 40-59 stretch worth considering · below 40 probably not`;

    const msg    = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const parsed = JSON.parse(msg.content[0].text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, ""));

    const results = parsed.ranked.map(r => {
      const m = allMissions[r.missionIndex];
      if (!m) return null;
      return { id:m.id, emoji:m.emoji, name:m.name, company:`${m.company} · ${m.planet}`, why:r.why, skills:m.skills||[], horizon:m.horizon, tags:m.tags||[], score:r.score };
    }).filter(Boolean);

    db.prepare("INSERT INTO matches (id,spark_hash,fuels,leap,results) VALUES (?,?,?,?,?)").run(
      randomUUID(), spark.length.toString(), JSON.stringify(fuels), leap, JSON.stringify(results.map(r=>r.id))
    );

    res.json({ results });

  } catch (err) {
    console.error("match error:", err.message);
    if (err instanceof SyntaxError) return res.status(502).json({ error: "ai returned unexpected format, please try again" });
    res.status(500).json({ error: "matching failed, please try again" });
  }
});

export default router;
