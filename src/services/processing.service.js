// src/services/processing.service.js
// ─────────────────────────────────────────────────────────────────────────────
// AI Content Processing
//
// Takes DRAFT stories (raw ingested content) and generates:
//   1. A clean summary (2-3 paragraphs)
//   2. A strategic breakdown (3 sections with heading + body)
//   3. A linked challenge question with 4 options + explanation
//
// After processing, story status moves: DRAFT → PROCESSING → REVIEW
// An editor then reviews and publishes.
// ─────────────────────────────────────────────────────────────────────────────

const { getDb } = require("../config/database");

// ─── PROMPTS ─────────────────────────────────────────────────────────────────

const SUMMARY_PROMPT = (product, tagline, rawContent) => `
You are a senior product analyst writing for an audience of product managers.

Given this product launch information:
Product: ${product}
Tagline: ${tagline}
Raw Content: ${rawContent}

Write a 2-3 paragraph summary (150-250 words) that covers:
- What the product does and who it's for
- What makes it different from competitors
- How it fits into the current market

Use clear, accessible language. Avoid excessive jargon.
Return ONLY the summary text, no headers or labels.
`;

const BREAKDOWN_PROMPT = (product, summary) => `
You are a senior product strategist. Based on this product summary:

Product: ${product}
Summary: ${summary}

Generate exactly 3 analysis sections as a JSON array. Each section should have:
1. A "Key Insight" — the core strategic decision that makes this product interesting
2. A "Growth Lever" — how the product acquires and retains users
3. A "Tradeoff" — what the product sacrifices and whether it's worth it

Return ONLY a JSON array like:
[
  {"heading": "Key Insight: ...", "body": "..."},
  {"heading": "Growth Lever: ...", "body": "..."},
  {"heading": "The Tradeoff: ...", "body": "..."}
]

Each body should be 60-100 words. Use clear language, not MBA jargon.
`;

const CHALLENGE_PROMPT = (product, summary, breakdown) => `
You are creating a strategic thinking challenge for product managers.

Product: ${product}
Summary: ${summary}
Breakdown: ${JSON.stringify(breakdown)}

Create ONE multiple-choice question that tests strategic reasoning about this product.
The question should require thinking about tradeoffs, not just recalling facts.

Return ONLY a JSON object:
{
  "skill": "STRATEGY",
  "question": "...",
  "options": [
    {"id": "a", "text": "...", "isCorrect": false},
    {"id": "b", "text": "...", "isCorrect": true},
    {"id": "c", "text": "...", "isCorrect": false},
    {"id": "d", "text": "...", "isCorrect": false}
  ],
  "explanation": "..."
}

The skill should be one of: STRATEGY, GROWTH, MONETIZATION, UX, ANALYTICS.
Exactly one option must have isCorrect: true.
The explanation should be 80-120 words explaining why the correct answer is right
and why the others fall short.
`;

// ─── AI CLIENT ───────────────────────────────────────────────────────────────

/**
 * Call the AI API (OpenAI, Anthropic, etc.) with a prompt.
 * Swap this implementation for your preferred provider.
 */
async function callAI(prompt, { expectJson = false } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for content processing");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
      ...(expectJson ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error(`AI returned empty response: ${JSON.stringify(data)}`);
  }

  if (expectJson) {
    return JSON.parse(text);
  }
  return text;
}

// ─── PROCESSING PIPELINE ─────────────────────────────────────────────────────

/**
 * Process a single DRAFT story:
 *   1. Generate summary from raw content
 *   2. Generate strategic breakdown from summary
 *   3. Generate challenge question from summary + breakdown
 *   4. Update story status to REVIEW
 *   5. Create linked Challenge record
 *
 * @param {string} storyId
 * @returns {object} { storyId, challengeId, status }
 */
async function processStory(storyId) {
  const db = getDb();

  const story = await db.story.findUnique({ where: { id: storyId } });
  if (!story) throw new Error(`Story not found: ${storyId}`);
  if (story.status !== "DRAFT") throw new Error(`Story ${storyId} is ${story.status}, expected DRAFT`);

  // Mark as processing
  await db.story.update({ where: { id: storyId }, data: { status: "PROCESSING" } });

  try {
    // Step 1: Generate summary
    const summary = await callAI(
      SUMMARY_PROMPT(story.product, story.tagline, story.rawContent || story.tagline)
    );

    // Step 2: Generate breakdown
    const breakdown = await callAI(
      BREAKDOWN_PROMPT(story.product, summary),
      { expectJson: true }
    );

    // Validate breakdown structure
    if (!Array.isArray(breakdown) || breakdown.length !== 3) {
      throw new Error("Breakdown must be an array of exactly 3 sections");
    }
    for (const section of breakdown) {
      if (!section.heading || !section.body) {
        throw new Error("Each breakdown section must have heading and body");
      }
    }

    // Step 3: Generate challenge
    const challengeData = await callAI(
      CHALLENGE_PROMPT(story.product, summary, breakdown),
      { expectJson: true }
    );

    // Validate challenge structure
    if (!challengeData.question || !challengeData.options || !challengeData.explanation) {
      throw new Error("Challenge must have question, options, and explanation");
    }
    const correctCount = challengeData.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error(`Challenge must have exactly 1 correct option, found ${correctCount}`);
    }

    // Step 4: Update story with generated content
    await db.story.update({
      where: { id: storyId },
      data: {
        summary,
        breakdown,
        readTimeMin: Math.max(3, Math.ceil(summary.split(" ").length / 200) + 3),
        status: "REVIEW",
      },
    });

    // Step 5: Create challenge record linked to this story
    const challenge = await db.challenge.create({
      data: {
        linkedStoryId: storyId,
        skill: challengeData.skill || "STRATEGY",
        question: challengeData.question,
        options: challengeData.options,
        explanation: challengeData.explanation,
        status: "REVIEW",
      },
    });

    return { storyId, challengeId: challenge.id, status: "REVIEW" };
  } catch (err) {
    // Revert to DRAFT on failure so it can be retried
    await db.story.update({ where: { id: storyId }, data: { status: "DRAFT" } });
    throw err;
  }
}

/**
 * Process all unprocessed DRAFT stories.
 * Called by cron after ingestion completes.
 */
async function processAllDrafts() {
  const db = getDb();
  const drafts = await db.story.findMany({
    where: { status: "DRAFT", rawContent: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20, // process max 20 at a time
  });

  const results = [];
  for (const story of drafts) {
    try {
      const result = await processStory(story.id);
      results.push(result);
    } catch (err) {
      results.push({ storyId: story.id, error: err.message });
    }
  }

  return results;
}

module.exports = { processStory, processAllDrafts };
