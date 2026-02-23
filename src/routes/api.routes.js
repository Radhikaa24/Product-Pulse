// src/routes/api.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// REST API Endpoints
//
// All routes return JSON. Auth-required routes check req.userId (set by middleware).
// Errors return { error: "message" } with appropriate status codes.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const editionService = require("../services/edition.service");
const progressService = require("../services/progress.service");
const ingestionService = require("../services/ingestion.service");
const processingService = require("../services/processing.service");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC / USER-FACING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/edition/today
 *
 * Returns today's published edition with stories and challenge.
 * If user is authenticated, includes their read/submission state.
 *
 * Query params:
 *   limit  - number of stories to return (default: 2)
 *   cursor - story ID for pagination (load more)
 *
 * Response: {
 *   date, stories[], challenge, pagination: { nextCursor, hasMore, total },
 *   userState: { readStoryIds[], challengeSubmission } | null
 * }
 */
router.get("/edition/today", optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 2, 20);
    const cursor = req.query.cursor || null;
    const userId = req.userId || null;

    const edition = await editionService.getTodayEdition(userId, limit, cursor);

    if (!edition.stories.length && !edition.challenge) {
      return res.status(404).json({ error: "No edition published for today" });
    }

    res.json(edition);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stories/:id
 *
 * Returns a single story with full breakdown.
 * If authenticated, includes whether the user has read it.
 *
 * Response: { id, product, tagline, source, sourceUrl, category, tags,
 *             summary, breakdown[], readTimeMin, isRead }
 */
router.get("/stories/:id", optionalAuth, async (req, res, next) => {
  try {
    const story = await editionService.getStory(req.params.id, req.userId);
    if (!story) return res.status(404).json({ error: "Story not found" });
    res.json(story);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/stories/:id/read
 *
 * Mark a story as read for the authenticated user.
 * Idempotent — calling twice for the same story is safe.
 *
 * Body (optional): { durationSec: number }
 *
 * Response: { readId, alreadyRead }
 */
router.post("/stories/:id/read", requireAuth, async (req, res, next) => {
  try {
    const result = await progressService.markStoryRead(
      req.userId,
      req.params.id,
      req.body?.durationSec || null
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/challenges/:id/submit
 *
 * Submit an answer to a challenge. Returns correctness, explanation, and updated streak.
 * Idempotent — resubmitting returns the original result.
 *
 * Body: { selectedOption: "a" | "b" | "c" | "d" }
 *
 * Response: { isCorrect, correctOption, explanation, streak, alreadySubmitted }
 */
router.post("/challenges/:id/submit", requireAuth, async (req, res, next) => {
  try {
    const { selectedOption } = req.body;
    if (!selectedOption || !["a", "b", "c", "d"].includes(selectedOption)) {
      return res.status(400).json({ error: "selectedOption must be a, b, c, or d" });
    }

    const result = await progressService.submitChallenge(
      req.userId,
      req.params.id,
      selectedOption
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard
 *
 * Returns the authenticated user's progress dashboard.
 *
 * Response: { streak, longestStreak, storiesRead, challengesDone,
 *             challengesCorrect, accuracy, skills[] }
 */
router.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const dashboard = await progressService.getDashboard(req.userId);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/archive
 *
 * Returns past editions for browsing.
 *
 * Query params: page (default 1), pageSize (default 10)
 *
 * Response: { editions[], pagination: { page, pageSize, total, totalPages } }
 */
router.get("/archive", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 50);
    const archive = await editionService.getArchive(page, pageSize);
    res.json(archive);
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN / INTERNAL ENDPOINTS
// Protected by admin auth in production.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/ingest
 *
 * Trigger content ingestion from a specific source.
 * Pulls raw content and stores as DRAFT stories in the database.
 *
 * Body: { source: "productHunt" | "rssFeed", params: { ... } }
 *
 * Response: { ingested, skipped, errors[] }
 */
router.post("/admin/ingest", requireAuth, async (req, res, next) => {
  try {
    const { source, params } = req.body;
    if (!source) return res.status(400).json({ error: "source is required" });

    const result = await ingestionService.ingest(source, params || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/process/:storyId
 *
 * Trigger AI processing for a single DRAFT story.
 * Generates summary, breakdown, and challenge; moves status to REVIEW.
 *
 * Response: { storyId, challengeId, status }
 */
router.post("/admin/process/:storyId", requireAuth, async (req, res, next) => {
  try {
    const result = await processingService.processStory(req.params.storyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/process-all
 *
 * Process all DRAFT stories that have raw content.
 *
 * Response: [{ storyId, challengeId, status } | { storyId, error }]
 */
router.post("/admin/process-all", requireAuth, async (req, res, next) => {
  try {
    const results = await processingService.processAllDrafts();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/edition/assemble
 *
 * Assemble an edition: assign stories and a challenge to a date.
 *
 * Body: { date: "2026-02-17", storyIds: [...], challengeId: "..." }
 */
router.post("/admin/edition/assemble", requireAuth, async (req, res, next) => {
  try {
    const { date, storyIds, challengeId } = req.body;
    if (!date || !storyIds?.length) {
      return res.status(400).json({ error: "date and storyIds are required" });
    }
    const edition = await editionService.assembleEdition(new Date(date), storyIds, challengeId);
    res.json(edition);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/edition/publish
 *
 * Publish an edition: move all REVIEW content to PUBLISHED.
 *
 * Body: { date: "2026-02-17" }
 */
router.post("/admin/edition/publish", requireAuth, async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "date is required" });
    const result = await editionService.publishEdition(new Date(date));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
