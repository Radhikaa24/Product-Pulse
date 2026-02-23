// src/services/ingestion.service.js
// ─────────────────────────────────────────────────────────────────────────────
// Content Ingestion Pipeline
//
// FLOW:  Source (PH, RSS, etc.)  →  ingest()  →  DB (status: DRAFT)
//        Then:  processStory()   →  AI summary/breakdown  →  DB (status: REVIEW)
//        Then:  Editorial review →  publishEdition()       →  DB (status: PUBLISHED)
//
// Nothing is hardcoded. Every story starts as raw ingested content,
// gets processed into structured data, and is only served after publishing.
// ─────────────────────────────────────────────────────────────────────────────

const { getDb } = require("../config/database");

// ─── SOURCE ADAPTERS ─────────────────────────────────────────────────────────
// Each adapter knows how to fetch content from one source and return a
// normalized object. Add new adapters here as you add sources.

const sourceAdapters = {
  /**
   * Product Hunt API v2
   * Requires PRODUCT_HUNT_TOKEN env var
   * Docs: https://api.producthunt.com/v2/docs
   */
  async productHunt({ token, daysBack = 1 }) {
    const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `{
          posts(order: VOTES, postedAfter: "${daysAgo(daysBack)}") {
            edges {
              node {
                id name tagline description url
                topics { edges { node { name } } }
                votesCount
              }
            }
          }
        }`,
      }),
    });

    const data = await response.json();
    const posts = data?.data?.posts?.edges || [];

    return posts.map(({ node }) => ({
      externalId: `ph-${node.id}`,
      product: node.name,
      tagline: node.tagline,
      source: "Product Hunt",
      sourceUrl: node.url,
      rawContent: node.description,
      category: node.topics?.edges?.[0]?.node?.name || "Uncategorized",
      tags: (node.topics?.edges || []).map((e) => e.node.name).slice(0, 5),
      votesCount: node.votesCount,
    }));
  },

  /**
   * RSS Feed adapter (Lenny's Newsletter, Stratechery, First Round, etc.)
   * Pass the feed URL; we parse and normalize entries.
   */
  async rssFeed({ feedUrl, sourceName }) {
    // In production, use a proper RSS parser like 'rss-parser'
    // const Parser = require("rss-parser");
    // const parser = new Parser();
    // const feed = await parser.parseURL(feedUrl);

    // Placeholder structure — replace with real parser
    const feed = { items: [] }; // ← swap with real parse

    return feed.items.map((item) => ({
      externalId: `rss-${Buffer.from(item.link || "").toString("base64").slice(0, 32)}`,
      product: item.title,
      tagline: item.contentSnippet?.slice(0, 200) || "",
      source: sourceName,
      sourceUrl: item.link,
      rawContent: item.content || item.contentSnippet || "",
      category: item.categories?.[0] || "Uncategorized",
      tags: (item.categories || []).slice(0, 5),
    }));
  },
};

// ─── INGESTION ───────────────────────────────────────────────────────────────

/**
 * Pull content from a specific source and store as DRAFT stories.
 * Deduplicates by source + product name to avoid re-ingesting.
 *
 * @param {string} sourceName - "productHunt" | "rssFeed"
 * @param {object} params - adapter-specific params (token, feedUrl, etc.)
 * @returns {object} { ingested: number, skipped: number, errors: string[] }
 */
async function ingest(sourceName, params) {
  const db = getDb();
  const adapter = sourceAdapters[sourceName];

  if (!adapter) {
    throw new Error(`Unknown source adapter: ${sourceName}. Available: ${Object.keys(sourceAdapters).join(", ")}`);
  }

  const rawItems = await adapter(params);
  const results = { ingested: 0, skipped: 0, errors: [] };

  for (const item of rawItems) {
    try {
      // Deduplicate: skip if we already have this product from this source
      const existing = await db.story.findFirst({
        where: { product: item.product, source: item.source },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await db.story.create({
        data: {
          product: item.product,
          tagline: item.tagline,
          source: item.source,
          sourceUrl: item.sourceUrl,
          category: item.category,
          tags: item.tags,
          summary: "",       // empty until AI processing
          breakdown: [],     // empty until AI processing
          rawContent: item.rawContent,
          status: "DRAFT",
        },
      });

      results.ingested++;
    } catch (err) {
      results.errors.push(`Failed to ingest ${item.product}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Fetch all configured sources in one call.
 * Used by the daily cron job.
 */
async function ingestAll(config) {
  const results = {};

  if (config.PRODUCT_HUNT_TOKEN) {
    results.productHunt = await ingest("productHunt", {
      token: config.PRODUCT_HUNT_TOKEN,
      daysBack: 1,
    });
  }

  // Add more sources here as needed:
  // results.lennys = await ingest("rssFeed", {
  //   feedUrl: "https://www.lennysnewsletter.com/feed",
  //   sourceName: "Lenny's Newsletter",
  // });

  return results;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

module.exports = { ingest, ingestAll, sourceAdapters };
