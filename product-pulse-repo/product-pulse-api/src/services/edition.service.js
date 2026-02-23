// src/services/edition.service.js
// ─────────────────────────────────────────────────────────────────────────────
// Edition Management
//
// An "edition" is one day's content: 2+ stories + 1 challenge.
// This service handles:
//   - Assembling editions from REVIEW-approved content
//   - Publishing editions (REVIEW → PUBLISHED)
//   - Serving today's edition to the API
//   - Progressive story loading (cursor-based pagination)
// ─────────────────────────────────────────────────────────────────────────────

const { getDb } = require("../config/database");

/**
 * Get today's date as a Date object (midnight UTC).
 */
function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Create an edition for a given date and assign stories + challenges to it.
 *
 * @param {Date} date - the edition date
 * @param {string[]} storyIds - ordered list of story IDs to include
 * @param {string} challengeId - the challenge ID for this edition
 */
async function assembleEdition(date, storyIds, challengeId) {
  const db = getDb();

  // Create or update the edition record
  const edition = await db.edition.upsert({
    where: { date },
    create: { date },
    update: {},
  });

  // Assign stories to this edition
  for (const storyId of storyIds) {
    await db.story.update({
      where: { id: storyId },
      data: { editionDate: date },
    });
  }

  // Assign challenge to this edition
  if (challengeId) {
    await db.challenge.update({
      where: { id: challengeId },
      data: { editionDate: date },
    });
  }

  return edition;
}

/**
 * Publish an edition: move all its stories and challenges from REVIEW → PUBLISHED.
 * Only call this after editorial approval.
 *
 * @param {Date} date
 */
async function publishEdition(date) {
  const db = getDb();

  await db.story.updateMany({
    where: { editionDate: date, status: "REVIEW" },
    data: { status: "PUBLISHED" },
  });

  await db.challenge.updateMany({
    where: { editionDate: date, status: "REVIEW" },
    data: { status: "PUBLISHED" },
  });

  await db.edition.update({
    where: { date },
    data: { publishedAt: new Date() },
  });

  return { date, status: "PUBLISHED" };
}

/**
 * Get today's published edition with stories and challenge.
 * This is the primary API endpoint for the frontend feed.
 *
 * @param {string|null} userId - if provided, includes user's read/submission state
 * @param {number} limit - how many stories to return (progressive loading)
 * @param {string|null} cursor - story ID cursor for pagination
 */
async function getTodayEdition(userId = null, limit = 2, cursor = null) {
  const db = getDb();
  const today = todayUTC();

  // Fetch stories for today's edition with cursor-based pagination
  const storiesQuery = {
    where: { editionDate: today, status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      product: true,
      tagline: true,
      source: true,
      sourceUrl: true,
      category: true,
      tags: true,
      summary: true,
      breakdown: true,
      readTimeMin: true,
    },
  };

  // If cursor is provided, fetch stories after that ID
  if (cursor) {
    storiesQuery.cursor = { id: cursor };
    storiesQuery.skip = 1; // skip the cursor itself
  }

  const stories = await db.story.findMany(storiesQuery);

  // Fetch today's challenge
  const challenge = await db.challenge.findFirst({
    where: { editionDate: today, status: "PUBLISHED" },
    select: {
      id: true,
      linkedStoryId: true,
      skill: true,
      question: true,
      options: true,
      explanation: true,
    },
  });

  // Count total stories for this edition (for "has more" indicator)
  const totalStories = await db.story.count({
    where: { editionDate: today, status: "PUBLISHED" },
  });

  // If user is logged in, fetch their progress for this edition
  let userState = null;
  if (userId) {
    const storyIds = stories.map((s) => s.id);

    const reads = await db.storyRead.findMany({
      where: { userId, storyId: { in: storyIds } },
      select: { storyId: true },
    });

    const submission = challenge
      ? await db.challengeSubmission.findUnique({
          where: { userId_challengeId: { userId, challengeId: challenge.id } },
          select: { selectedOption: true, isCorrect: true },
        })
      : null;

    userState = {
      readStoryIds: reads.map((r) => r.storyId),
      challengeSubmission: submission,
    };
  }

  // Build the next cursor
  const nextCursor = stories.length > 0 ? stories[stories.length - 1].id : null;
  const hasMore = cursor
    ? stories.length === limit
    : totalStories > limit;

  return {
    date: today.toISOString().split("T")[0],
    stories,
    challenge: challenge
      ? {
          ...challenge,
          linkedProduct: stories.find((s) => s.id === challenge.linkedStoryId)?.product || null,
        }
      : null,
    pagination: { nextCursor, hasMore, total: totalStories },
    userState,
  };
}

/**
 * Get a single story by ID (for the full story view).
 */
async function getStory(storyId, userId = null) {
  const db = getDb();

  const story = await db.story.findUnique({
    where: { id: storyId },
    select: {
      id: true,
      product: true,
      tagline: true,
      source: true,
      sourceUrl: true,
      category: true,
      tags: true,
      summary: true,
      breakdown: true,
      readTimeMin: true,
      editionDate: true,
    },
  });

  if (!story) return null;

  let isRead = false;
  if (userId) {
    const read = await db.storyRead.findUnique({
      where: { userId_storyId: { userId, storyId } },
    });
    isRead = !!read;
  }

  return { ...story, isRead };
}

/**
 * Get past editions for the archive page.
 */
async function getArchive(page = 1, pageSize = 10) {
  const db = getDb();

  const editions = await db.edition.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { date: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      stories: {
        where: { status: "PUBLISHED" },
        select: { id: true, product: true, tagline: true, category: true, readTimeMin: true },
      },
      challenges: {
        where: { status: "PUBLISHED" },
        select: { id: true, skill: true },
      },
    },
  });

  const total = await db.edition.count({ where: { publishedAt: { not: null } } });

  return { editions, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

module.exports = {
  assembleEdition,
  publishEdition,
  getTodayEdition,
  getStory,
  getArchive,
};
