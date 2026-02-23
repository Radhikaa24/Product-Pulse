// src/services/progress.service.js
// ─────────────────────────────────────────────────────────────────────────────
// User Progress Tracking
//
// Handles: story reads, challenge submissions, streak management, skill scores.
// Streak logic: increments when user answers the daily challenge correctly.
// Resets if no activity for > 36 hours (timezone-friendly buffer).
// ─────────────────────────────────────────────────────────────────────────────

const { getDb } = require("../config/database");

const STREAK_WINDOW_HOURS = 36; // time before streak resets

/**
 * Mark a story as read for a user.
 *
 * @param {string} userId
 * @param {string} storyId
 * @param {number|null} durationSec - optional read duration for analytics
 * @returns {object} { readId, alreadyRead }
 */
async function markStoryRead(userId, storyId, durationSec = null) {
  const db = getDb();

  // Check if already read (idempotent)
  const existing = await db.storyRead.findUnique({
    where: { userId_storyId: { userId, storyId } },
  });

  if (existing) {
    return { readId: existing.id, alreadyRead: true };
  }

  const read = await db.storyRead.create({
    data: { userId, storyId, durationSec },
  });

  // Update last active date for streak tracking
  await touchUserActivity(userId);

  return { readId: read.id, alreadyRead: false };
}

/**
 * Submit a challenge answer.
 *
 * Validates the answer, records the submission, updates streak and skill scores.
 * Returns the result + explanation so the frontend can show feedback.
 *
 * @param {string} userId
 * @param {string} challengeId
 * @param {string} selectedOption - "a", "b", "c", or "d"
 * @returns {object} { isCorrect, explanation, streak, alreadySubmitted }
 */
async function submitChallenge(userId, challengeId, selectedOption) {
  const db = getDb();

  // Check if already submitted (idempotent — return previous result)
  const existing = await db.challengeSubmission.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
  });

  if (existing) {
    const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
    const user = await db.user.findUnique({ where: { id: userId } });
    return {
      isCorrect: existing.isCorrect,
      explanation: challenge?.explanation || "",
      streak: user?.currentStreak || 0,
      alreadySubmitted: true,
    };
  }

  // Fetch the challenge and validate
  const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw new Error(`Challenge not found: ${challengeId}`);

  const options = challenge.options;
  const correctOption = options.find((o) => o.isCorrect);
  const isCorrect = correctOption?.id === selectedOption;

  // Record submission
  await db.challengeSubmission.create({
    data: { userId, challengeId, selectedOption, isCorrect },
  });

  // Update streak
  const streak = await updateStreak(userId, isCorrect);

  // Update skill scores
  await updateSkillScore(userId, challenge.skill, isCorrect);

  return {
    isCorrect,
    correctOption: correctOption?.id,
    explanation: challenge.explanation,
    streak,
    alreadySubmitted: false,
  };
}

/**
 * Update the user's streak based on challenge result.
 * Correct answer → increment streak.
 * Incorrect answer → activity counts (no reset), but streak doesn't grow.
 */
async function updateStreak(userId, isCorrect) {
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`User not found: ${userId}`);

  const now = new Date();
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  const hoursSinceActive = lastActive
    ? (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)
    : Infinity;

  let newStreak = user.currentStreak;

  if (hoursSinceActive > STREAK_WINDOW_HOURS) {
    // Streak expired — reset to 1 if correct, 0 if incorrect
    newStreak = isCorrect ? 1 : 0;
  } else if (isCorrect) {
    // Within window and correct — increment
    newStreak = user.currentStreak + 1;
  }
  // If within window but incorrect, streak stays the same

  const longestStreak = Math.max(user.longestStreak, newStreak);

  await db.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActiveDate: now,
    },
  });

  return newStreak;
}

/**
 * Update skill accuracy scores for the dashboard.
 */
async function updateSkillScore(userId, skill, isCorrect) {
  // Skill scores are computed from challenge_submissions on read.
  // No separate table needed — we query aggregates directly.
  // This function is a hook for future caching/denormalization.
}

/**
 * Touch the user's last active date (called on any activity).
 */
async function touchUserActivity(userId) {
  const db = getDb();
  await db.user.update({
    where: { id: userId },
    data: { lastActiveDate: new Date() },
  });
}

/**
 * Get full dashboard data for a user.
 *
 * @param {string} userId
 * @returns {object} { streak, longestStreak, storiesRead, challengesDone, accuracy, skills }
 */
async function getDashboard(userId) {
  const db = getDb();

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`User not found: ${userId}`);

  const storiesRead = await db.storyRead.count({ where: { userId } });

  const challengeStats = await db.challengeSubmission.aggregate({
    where: { userId },
    _count: true,
    _sum: { isCorrect: false }, // doesn't sum booleans; we'll query separately
  });

  const correctCount = await db.challengeSubmission.count({
    where: { userId, isCorrect: true },
  });

  const totalChallenges = challengeStats._count || 0;
  const accuracy = totalChallenges > 0 ? Math.round((correctCount / totalChallenges) * 100) : null;

  // Skill breakdown: accuracy per skill category
  const skillResults = await db.challengeSubmission.groupBy({
    by: ["challengeId"],
    where: { userId },
    _count: true,
  });

  // Fetch skills for each challenge and aggregate
  const skillMap = {};
  for (const sr of skillResults) {
    const challenge = await db.challenge.findUnique({
      where: { id: sr.challengeId },
      select: { skill: true },
    });
    if (challenge) {
      if (!skillMap[challenge.skill]) {
        skillMap[challenge.skill] = { attempts: 0, correct: 0 };
      }
      skillMap[challenge.skill].attempts++;
    }
  }

  // Count correct per skill
  const correctSubmissions = await db.challengeSubmission.findMany({
    where: { userId, isCorrect: true },
    select: { challengeId: true },
  });

  for (const cs of correctSubmissions) {
    const challenge = await db.challenge.findUnique({
      where: { id: cs.challengeId },
      select: { skill: true },
    });
    if (challenge && skillMap[challenge.skill]) {
      skillMap[challenge.skill].correct++;
    }
  }

  const skills = Object.entries(skillMap).map(([skill, data]) => ({
    skill,
    attempts: data.attempts,
    correct: data.correct,
    accuracy: data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0,
  }));

  return {
    streak: user.currentStreak,
    longestStreak: user.longestStreak,
    storiesRead,
    challengesDone: totalChallenges,
    challengesCorrect: correctCount,
    accuracy,
    skills,
  };
}

module.exports = {
  markStoryRead,
  submitChallenge,
  getDashboard,
};
