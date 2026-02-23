import { useState, useEffect, useRef, useCallback } from "react";

const ALL_STORIES = [
  {
    id: "s1", product: "Granola", tagline: "The AI notepad for people in back-to-back meetings",
    source: "Product Hunt", sourceUrl: "https://www.producthunt.com/posts/granola-3",
    readTime: "4 min read", category: "AI / Productivity", tags: ["AI", "UX", "Growth", "B2B SaaS"],
    summary: "Granola launched as an AI-powered meeting notepad that listens to your calls and combines your rough notes with the full transcript to produce clean, organized summaries. Unlike competitors that join as a visible bot, Granola runs locally on your device — a deliberate design choice to reduce awkwardness in meetings. It connects with Google Calendar and works across Zoom, Meet, and Teams.",
    breakdown: [
      { heading: "Key Insight: Invisible AI as an Advantage", body: "Most AI meeting tools (Otter, Fireflies, Read.ai) join meetings as a visible participant — creating awkwardness and trust issues. Granola's core insight is that the best AI stays out of sight. By running on your device and never joining the call, they remove the single biggest barrier to adoption in their category. This isn't just a feature — it's a positioning decision that shapes their entire product." },
      { heading: "Growth Lever: Calendar-Based Distribution", body: "By connecting to Google Calendar, Granola shows up in the user's daily routine before they even open the app. Every meeting becomes a touchpoint. This creates a passive habit loop — users don't need to remember to open the product; the product appears at exactly the right moment." },
      { heading: "The Tradeoff: Privacy vs. Cloud-Powered Features", body: "Running on-device limits the ability to build cross-organization insights (like meeting trends or team analytics) that cloud-based competitors can offer. Granola is choosing faster adoption today over long-term data advantages. The question is whether that adoption lead grows fast enough to make the tradeoff pay off." },
    ],
  },
  {
    id: "s2", product: "Loops", tagline: "Email marketing platform built for modern SaaS teams",
    source: "Lenny's Newsletter", sourceUrl: "https://www.lennysnewsletter.com/",
    readTime: "5 min read", category: "Growth / Email", tags: ["Monetization", "Platform", "Growth", "Developer Tools"],
    summary: "Loops is positioning itself as the anti-Mailchimp — a modern, developer-first email platform built specifically for SaaS companies. Instead of competing on template libraries and drag-and-drop editors, Loops focuses on combining transactional and marketing email, an API-first design, and event-driven automation. Their pricing undercuts bigger players significantly, with a generous free tier aimed at capturing startups early.",
    breakdown: [
      { heading: "Key Insight: Winning a Niche Before Expanding", body: "Loops isn't trying to beat Mailchimp at its own game. Instead, they're targeting a specific person (the SaaS developer or founder) with a specific hook (API-first email that handles both transactional and marketing). This lets them avoid feature-by-feature comparisons and instead win on workflow fit. It's a classic approach — own a niche completely, then grow from there." },
      { heading: "Monetization: Start Free, Grow Revenue Over Time", body: "The generous free tier is designed for early-stage startups who will grow into paying customers. This is the Stripe playbook: win developers at day zero, grow revenue as their business scales. The economics only work if Loops keeps users as they outgrow the free tier — which means the product needs to become deeply embedded in their workflow." },
      { heading: "Risk: Bigger Players Bundling Similar Features", body: "Established players like HubSpot, Brevo, and even Resend are adding similar capabilities. Loops' biggest risk isn't being feature-matched — it's distribution. Bigger companies can bundle email into larger product suites at near-zero extra cost. Loops needs to build switching costs fast through deep integrations and workflow habits." },
    ],
  },
  {
    id: "s3", product: "Arc", tagline: "The browser that replaces your tabs with organized spaces",
    source: "The Verge", sourceUrl: "https://www.theverge.com/",
    readTime: "5 min read", category: "Consumer / UX", tags: ["UX", "Consumer", "Platform", "Design"],
    summary: "Arc by The Browser Company reimagines the web browser around spaces, profiles, and a sidebar that replaces the traditional tab bar. Instead of fighting tab overload, Arc encourages users to organize their web life into distinct workspaces — one for work, one for personal, one for a side project. The result is a browser that feels more like an operating system for the internet.",
    breakdown: [
      { heading: "Key Insight: Redesigning a Habit Nobody Questions", body: "Tabs have been the default browsing model for 20+ years. Arc's bet is that users don't actually want tabs — they want organized contexts. By replacing tabs with spaces and a sidebar, Arc forces a new mental model. The risk is high (people resist changing deep habits), but the reward is a completely differentiated product in a commoditized category." },
      { heading: "Growth Lever: Word-of-Mouth Through Delight", body: "Arc's growth has been almost entirely organic, driven by users who love the product sharing it with friends and colleagues. Features like Boosts (custom CSS for any website) and Easels (visual mood boards) create shareable moments. This is the classic product-so-good-people-can't-stop-talking-about-it playbook." },
      { heading: "The Tradeoff: Delight vs. Enterprise Revenue", body: "Arc's consumer-first approach creates passionate individual users, but enterprise deals (where browser revenue historically lives) require IT admin controls, compliance features, and fleet management. Arc needs to decide: stay consumer-beloved or build the boring features that unlock business revenue." },
    ],
  },
  {
    id: "s4", product: "Cursor", tagline: "The AI-first code editor that writes code with you",
    source: "TechCrunch", sourceUrl: "https://techcrunch.com/",
    readTime: "4 min read", category: "AI / Developer Tools", tags: ["AI", "Developer Tools", "Platform", "Growth"],
    summary: "Cursor is an AI-powered code editor built as a fork of VS Code, with deep AI integration at every level. Instead of bolting AI onto an existing editor as a plugin, Cursor rebuilds the editing experience around AI-assisted workflows — inline code generation, multi-file editing, and codebase-aware chat. It's quickly become the default editor for AI-native developers.",
    breakdown: [
      { heading: "Key Insight: Fork, Don't Plugin", body: "GitHub Copilot works as an extension inside VS Code. Cursor took the radical approach of forking VS Code entirely, giving them full control over the editor experience. This means they can redesign the UI around AI workflows — something an extension can never do. The tradeoff is maintaining a fork of a massive open-source project, but the UX advantage is significant." },
      { heading: "Growth Lever: Developer Community Evangelism", body: "Cursor spread through developer Twitter and YouTube like wildfire. Developers who tried it posted side-by-side comparisons showing dramatic productivity gains. This created a viral loop: see a demo, try it, post your own demo. The product essentially marketed itself through the work people did with it." },
      { heading: "The Tradeoff: Speed vs. Ecosystem", body: "By forking VS Code, Cursor gets speed of innovation but risks falling behind on the extension ecosystem. Every VS Code update needs to be merged. Every popular extension needs to be tested. As the editor grows, maintaining compatibility while pushing AI-first features becomes an increasingly expensive balancing act." },
    ],
  },
  {
    id: "s5", product: "Linear", tagline: "Project tracking tool that developers actually enjoy using",
    source: "First Round Review", sourceUrl: "https://review.firstround.com/",
    readTime: "6 min read", category: "Productivity / B2B", tags: ["B2B SaaS", "UX", "Growth", "Developer Tools"],
    summary: "Linear has grown into one of the most popular project management tools among engineering teams by obsessing over speed, keyboard shortcuts, and a minimal interface. While Jira dominates enterprise, Linear targets fast-moving startups and scale-ups who value speed over configurability. Their approach: build an opinionated tool that works beautifully out of the box rather than a flexible tool that requires weeks of setup.",
    breakdown: [
      { heading: "Key Insight: Opinionated Design Beats Customization", body: "Jira lets you configure everything — and that's exactly the problem. Teams spend weeks setting up workflows before writing a single ticket. Linear flips this: strong defaults, minimal configuration, instant value. This opinionated approach means some teams won't fit, but those who do become passionate advocates. It's the Apple playbook applied to project management." },
      { heading: "Growth Lever: Speed as a Feature", body: "Linear's interface loads instantly and responds to every interaction in milliseconds. This isn't just polish — it's a deliberate growth strategy. When your daily-use tool feels fast and fluid, you notice it. You tell your friends. And when you switch jobs, you bring Linear with you. Speed becomes the word-of-mouth trigger." },
      { heading: "The Tradeoff: Startup Darling vs. Enterprise Scale", body: "Linear's minimal, opinionated approach works beautifully for 10-200 person companies. But as companies grow past 500 people, they typically need the customization and compliance features that Jira provides. Linear's challenge is growing with their customers without losing the simplicity that made them special." },
    ],
  },
  {
    id: "s6", product: "Perplexity", tagline: "AI-powered answer engine challenging Google Search",
    source: "Stratechery", sourceUrl: "https://stratechery.com/",
    readTime: "5 min read", category: "AI / Search", tags: ["AI", "Consumer", "Monetization", "Platform"],
    summary: "Perplexity has emerged as the leading AI-powered search alternative, combining large language models with real-time web retrieval to deliver direct answers with cited sources. Rather than showing ten blue links, Perplexity synthesizes information into a coherent answer — then lets users ask follow-up questions in a conversational flow. Their Pro tier adds access to more powerful models and deeper research capabilities.",
    breakdown: [
      { heading: "Key Insight: Answers Over Links", body: "Google's business model depends on showing links (and ads alongside them). Perplexity's model depends on delivering the answer directly. This isn't just a UX improvement — it's a fundamentally different value proposition. Users don't want to visit five websites and piece together an answer. They want the answer. Perplexity bets that this shift is permanent." },
      { heading: "Monetization: Subscription in a Free-Search World", body: "Charging for search is counterintuitive in a world where Google is free. Perplexity's bet is that a subset of power users (researchers, professionals, curious minds) will pay for better answers, faster. At $20/month for Pro, they need relatively few subscribers to build a real business. The question is how big that ceiling is." },
      { heading: "Risk: The Google Response", body: "Google has been integrating AI answers into search results with AI Overviews. With 90%+ market share and massive distribution through Chrome, Android, and default search deals, Google can ship a good-enough AI search experience to billions overnight. Perplexity needs to stay meaningfully better, not just slightly better." },
    ],
  },
  {
    id: "s7", product: "Notion Calendar", tagline: "A calendar built to live alongside your docs and projects",
    source: "Product Hunt", sourceUrl: "https://www.producthunt.com/",
    readTime: "4 min read", category: "Productivity / Integration", tags: ["Productivity", "UX", "Platform", "B2B SaaS"],
    summary: "Notion Calendar (formerly Cron) is Notion's play to own the full productivity workflow — not just docs and wikis, but time management too. It connects directly with Notion databases, letting users link calendar events to project pages, meeting notes, and tasks. The goal is to make your calendar feel like a natural extension of your workspace rather than a separate tool you alt-tab into.",
    breakdown: [
      { heading: "Key Insight: Bundling as a Retention Play", body: "Notion acquired Cron not to enter the calendar business, but to increase switching costs. When your calendar, docs, projects, and wiki all live in one ecosystem, leaving Notion means leaving everything. Each new integrated tool makes the bundle stickier. This is the Microsoft Office playbook — own the workflow, not just the document." },
      { heading: "Growth Lever: Cross-Sell to Existing Users", body: "With over 30 million users already on Notion, Calendar doesn't need to acquire new customers — it needs to activate existing ones. Every Notion user who adopts Calendar becomes harder to churn. The distribution is already solved; the challenge is making the product good enough to pull users away from Google Calendar." },
      { heading: "The Tradeoff: Integration Depth vs. Standalone Quality", body: "A calendar that's deeply tied to Notion is powerful for Notion users but underwhelming for everyone else. If Notion Calendar only shines within the Notion ecosystem, it limits its addressable market. But making it great as a standalone product dilutes the integration advantage that justified the acquisition." },
    ],
  },
  {
    id: "s8", product: "Raycast", tagline: "A launcher that's quietly replacing your entire toolbox",
    source: "Indie Hackers", sourceUrl: "https://www.indiehackers.com/",
    readTime: "4 min read", category: "Productivity / Developer Tools", tags: ["Developer Tools", "UX", "Growth", "Platform"],
    summary: "Raycast started as a Spotlight replacement for Mac but has evolved into a full productivity platform — clipboard manager, window manager, snippet expander, AI chat, and an extension store with 1000+ community-built integrations. Their strategy: replace 5-10 small utilities with one fast, keyboard-driven interface. The free tier is generous; Pro adds AI features and team sharing.",
    breakdown: [
      { heading: "Key Insight: Platform Through the Launcher", body: "Most launcher apps stay launchers. Raycast recognized that if you own the keyboard shortcut users press 50+ times a day, you can layer on any utility. Clipboard history, window management, emoji picker, AI chat — each feature replaces a separate paid app. The launcher becomes the platform, and each replaced app increases switching costs." },
      { heading: "Growth Lever: Extension Ecosystem", body: "Raycast's community extension store means developers build integrations for Jira, GitHub, Figma, Slack, and hundreds more. Each extension brings in that tool's user base. This is the classic platform flywheel: more extensions attract more users, more users attract more extension developers. Raycast doesn't need to build everything — the community does it for them." },
      { heading: "The Tradeoff: Mac-Only in a Cross-Platform World", body: "Raycast is Mac-only, which limits their market to roughly 15-20% of desktop users. Enterprise teams with mixed OS environments can't standardize on Raycast. Going cross-platform is expensive and risks losing the deep macOS integration that makes the product feel native. But staying Mac-only caps their growth ceiling." },
    ],
  },
];

const EDITION = {
  id: "2026-02-17", date: "February 17, 2026", dayLabel: "Monday",
  challenge: {
    id: "c1", linkedStoryId: "s1", linkedProduct: "Granola", skill: "Strategy",
    question: "Granola runs its AI meeting assistant entirely on-device rather than joining calls as a cloud-based bot. If Granola succeeds with this approach and reaches 500K users, which advantage becomes hardest for cloud-based competitors to replicate?",
    options: [
      { id: "a", text: "Better transcript accuracy through larger cloud-based AI models", isCorrect: false },
      { id: "b", text: "Trust-driven adoption among privacy-conscious enterprise teams", isCorrect: true },
      { id: "c", text: "Lower costs from reduced server processing", isCorrect: false },
      { id: "d", text: "Faster feature releases through centralized deployment", isCorrect: false },
    ],
    explanation: "The key insight is that Granola's on-device approach isn't just a technical choice — it builds a trust advantage. Once privacy-conscious enterprise teams adopt a tool they trust because it never sends meeting data to external servers, switching to a cloud-based competitor means overcoming that built-up trust. Cloud competitors can't easily add an 'on-device mode' — their entire architecture and business model depends on cloud processing. Options A and D are actually strengths of cloud competitors, not things they'd struggle to match. Option C is a side effect, not a real competitive advantage. The trust and positioning advantage is what compounds over time and becomes hard to copy.",
  },
};

const ArrowRight = () => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>);
const ExternalLink = () => (<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" /></svg>);
const CheckCircle = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>);
const XCircle = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0440E" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>);
const Flame = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2c0 4-4 6-4 10a4 4 0 008 0c0-4-4-6-4-10z" fill="#C0440E" opacity="0.15" stroke="#C0440E" strokeWidth="1.5" /></svg>);
const BookOpen = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>);
const Target = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);

export default function ProductPulseApp() {
  const [view, setView] = useState("feed");
  const [activeStory, setActiveStory] = useState(null);
  const [readStories, setReadStories] = useState(new Set());
  const [challengeAnswer, setChallengeAnswer] = useState(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const [streak, setStreak] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);

  const edition = EDITION;
  const visibleStories = ALL_STORIES.slice(0, visibleCount);
  const hasMore = visibleCount < ALL_STORIES.length;

  const handleReadStory = (sid) => { setReadStories((p) => new Set([...p, sid])); };
  const handleChallengeSubmit = () => {
    if (!challengeAnswer) return;
    setChallengeSubmitted(true);
    if (edition.challenge.options.find((o) => o.id === challengeAnswer)?.isCorrect) {
      setStreak((s) => s + 1); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500);
    }
  };
  const openStory = (s) => { setActiveStory(s); setView("story"); };
  const loadMore = () => { setVisibleCount((c) => Math.min(c + 1, ALL_STORIES.length)); };

  const getNextStory = (cid) => {
    const ci = ALL_STORIES.findIndex((s) => s.id === cid);
    for (let i = ci + 1; i < ALL_STORIES.length; i++) if (!readStories.has(ALL_STORIES[i].id)) return ALL_STORIES[i];
    for (let i = 0; i < ALL_STORIES.length; i++) if (i !== ci && !readStories.has(ALL_STORIES[i].id)) return ALL_STORIES[i];
    if (ci + 1 < ALL_STORIES.length) return ALL_STORIES[ci + 1];
    return null;
  };
  const handleNextStory = (cid) => {
    const next = getNextStory(cid);
    if (next) {
      const ni = ALL_STORIES.findIndex((s) => s.id === next.id);
      if (ni >= visibleCount) setVisibleCount(ni + 1);
      setActiveStory(next); window.scrollTo(0, 0);
    }
  };

  const stats = {
    streak, storiesRead: readStories.size,
    challengesAttempted: challengeSubmitted ? 1 : 0,
    challengesCorrect: challengeSubmitted && edition.challenge.options.find((o) => o.id === challengeAnswer)?.isCorrect ? 1 : 0,
    accuracy: challengeSubmitted ? (edition.challenge.options.find((o) => o.id === challengeAnswer)?.isCorrect ? 100 : 0) : null,
  };

  return (
    <div style={S.app}>
      {showConfetti && <Confetti />}
      <Header view={view} setView={setView} />
      {view === "feed" && <FeedView edition={edition} visibleStories={visibleStories} readStories={readStories} challengeSubmitted={challengeSubmitted} challengeAnswer={challengeAnswer} streak={streak} hasMore={hasMore} onOpenStory={openStory} onSelectAnswer={setChallengeAnswer} onSubmitChallenge={handleChallengeSubmit} onLoadMore={loadMore} />}
      {view === "story" && activeStory && <StoryView story={activeStory} isRead={readStories.has(activeStory.id)} onMarkRead={handleReadStory} onBack={() => setView("feed")} nextStory={getNextStory(activeStory.id)} onNextStory={() => handleNextStory(activeStory.id)} />}
      {view === "dashboard" && <DashboardView stats={stats} onBack={() => setView("feed")} />}
      <footer style={S.footer}><p style={S.footerTagline}>Sharp product minds are built daily, not crammed.</p><p style={S.footerCopy}>&copy; 2026 Product Pulse. Daily product insights for PMs.</p></footer>
    </div>
  );
}

function Header({ view, setView }) {
  return (
    <header style={S.header}><div style={S.headerInner}>
      <div style={S.logo} onClick={() => setView("feed")}><div style={S.logoMark}>P</div><span style={S.logoText}>Product Pulse</span></div>
      <nav style={S.nav}>
        <a style={{ ...S.navLink, ...(view === "feed" ? S.navActive : {}) }} onClick={() => setView("feed")}>Today</a>
        <a style={{ ...S.navLink, ...(view === "dashboard" ? S.navActive : {}) }} onClick={() => setView("dashboard")}>Dashboard</a>
        <span style={S.headerDate}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
      </nav>
    </div></header>
  );
}

function Confetti() {
  const ps = Array.from({ length: 30 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 0.5, size: 4 + Math.random() * 6, color: ["#C0440E","#2E7D32","#1565C0","#F9A825","#6A1B9A"][Math.floor(Math.random() * 5)], duration: 1.5 + Math.random() * 1.5 }));
  return (<div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
    <style>{`@keyframes cf { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
    {ps.map((p) => <div key={p.id} style={{ position: "absolute", top: 0, left: `${p.left}%`, width: p.size, height: p.size, background: p.color, borderRadius: p.size > 7 ? "50%" : "1px", animation: `cf ${p.duration}s ease-out ${p.delay}s forwards` }} />)}
  </div>);
}

function FeedView({ edition, visibleStories, readStories, challengeSubmitted, challengeAnswer, streak, hasMore, onOpenStory, onSelectAnswer, onSubmitChallenge, onLoadMore }) {
  const ch = edition.challenge;
  const isCorrect = challengeSubmitted && ch.options.find((o) => o.isCorrect)?.id === challengeAnswer;
  return (
    <div>
      <section style={S.hero}>
        <div style={S.eyebrow}><span style={S.pulseDot} /><span>Today's Edition &middot; {edition.date}</span></div>
        <h1 style={S.heroTitle}>Your daily dose of <em style={S.heroEm}>product insight</em></h1>
        <p style={S.heroSub}>Curated product stories and a hands-on challenge — read, reflect, and sharpen your PM instincts.</p>
      </section>
      <div style={S.streakWrap}><div style={S.streakInner}>
        <div style={S.streakLeft}><Flame /><div><div style={S.streakNum}>{streak}</div><div style={S.streakLabel}>day streak</div></div></div>
        <div style={S.streakDays}>{["M","T","W","T","F","S","S"].map((d,i) => <div key={i} style={{ ...S.streakDot, ...(i < streak ? S.streakDotFilled : {}), ...(i === streak ? S.streakDotToday : {}) }}>{d}</div>)}</div>
      </div></div>
      <div style={S.sectionDivider}><div style={S.divLine} /><span style={S.divText}>Today's Stories</span><div style={S.divLine} /></div>
      <div style={S.feed}>
        {visibleStories.map((story, idx) => <StoryCard key={story.id} story={story} featured={idx === 0} isRead={readStories.has(story.id)} onOpen={() => onOpenStory(story)} />)}
        {hasMore && <button style={S.loadMoreBtn} onClick={onLoadMore}>Load next story <ArrowRight /></button>}
        {!hasMore && <div style={S.allCaughtUp}><span style={{ fontSize: 16 }}>✓</span> You've seen all stories for today</div>}
        <div style={S.sectionDivider}><div style={S.divLine} /><span style={S.divText}>Daily Challenge</span><div style={S.divLine} /></div>
        <div style={S.chalWrap}>
          <div style={{ marginBottom: 20 }}>
            <div style={S.chalMeta}><span style={S.chalBadge}>{ch.skill}</span><span style={S.chalLinked}>Based on {ch.linkedProduct}</span></div>
            <h2 style={S.chalTitle}>{challengeSubmitted ? "Challenge Completed" : "Today's Challenge"}</h2>
          </div>
          <div style={S.chalQBox}><p style={S.chalQText}>{ch.question}</p></div>
          <div style={S.chalOpts}>
            {ch.options.map((opt) => {
              let os = { ...S.chalOpt };
              if (challengeSubmitted) { if (opt.isCorrect) os = { ...os, ...S.optCorrect }; else if (opt.id === challengeAnswer) os = { ...os, ...S.optWrong }; else os = { ...os, ...S.optDis }; }
              else if (opt.id === challengeAnswer) os = { ...os, ...S.optSel };
              return (<button key={opt.id} style={os} onClick={() => !challengeSubmitted && onSelectAnswer(opt.id)} disabled={challengeSubmitted}>
                <span style={S.optLetter}>{opt.id.toUpperCase()}</span><span style={S.optText}>{opt.text}</span>
                {challengeSubmitted && opt.isCorrect && <span style={S.optIcon}><CheckCircle /></span>}
                {challengeSubmitted && !opt.isCorrect && opt.id === challengeAnswer && <span style={S.optIcon}><XCircle /></span>}
              </button>);
            })}
          </div>
          {!challengeSubmitted && <button style={{ ...S.submitBtn, ...(challengeAnswer ? {} : S.submitDis) }} onClick={onSubmitChallenge} disabled={!challengeAnswer}>Submit Answer</button>}
          {challengeSubmitted && (<div style={{ marginTop: 24 }}>
            <div style={{ ...S.resBanner, background: isCorrect ? "#E8F5E9" : "#FFF0EB", borderColor: isCorrect ? "#A5D6A7" : "#FFCCBC" }}>
              <span style={{ fontSize: 20 }}>{isCorrect ? "🎯" : "💡"}</span>
              <div><strong style={{ color: isCorrect ? "#2E7D32" : "#C0440E" }}>{isCorrect ? "Correct! Streak extended." : "Not quite — but great thinking."}</strong></div>
            </div>
            <div style={S.expContent}><h4 style={S.expTitle}>Why this answer?</h4><p style={S.expText}>{ch.explanation}</p></div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

function StoryCard({ story, featured, isRead, onOpen }) {
  const f = featured;
  return (
    <article style={{ ...S.card, ...(f ? S.cardFeat : {}) }} onClick={onOpen}>
      {isRead && <div style={S.readBadge}><CheckCircle /> Read</div>}
      <div style={S.cardHeader}><div style={S.cardMeta}><span style={{ ...S.cardSrc, ...(f ? S.cardSrcF : {}) }}>{story.source}</span><span style={{ ...S.cardTime, ...(f ? S.cardTimeF : {}) }}>{story.readTime}</span></div><span style={{ ...S.cardCat, ...(f ? S.cardCatF : {}) }}>{story.category}</span></div>
      <h2 style={{ ...S.cardTitle, ...(f ? S.cardTitleF : {}) }}>{story.product}: {story.tagline}</h2>
      <p style={{ ...S.cardExcerpt, ...(f ? S.cardExcerptF : {}) }}>{story.summary.slice(0, 180)}...</p>
      <div style={S.cardTags}>{story.tags.map((t) => <span key={t} style={{ ...S.tag, ...(f ? S.tagF : {}) }}>{t}</span>)}</div>
      <div style={{ ...S.cardFoot, ...(f ? S.cardFootF : {}) }}><span style={{ ...S.cardPrompt, ...(f ? S.cardPromptF : {}) }}>Read full breakdown →</span></div>
    </article>
  );
}

function StoryView({ story, isRead, onMarkRead, onBack, nextStory, onNextStory }) {
  const contentRef = useRef(null);
  const markedRef = useRef(false);
  const handleScroll = useCallback(() => {
    if (markedRef.current || !contentRef.current) return;
    const el = contentRef.current;
    if (window.scrollY + window.innerHeight >= el.offsetTop + el.offsetHeight * 0.7) { markedRef.current = true; onMarkRead(story.id); }
  }, [story.id, onMarkRead]);
  useEffect(() => { window.addEventListener("scroll", handleScroll, { passive: true }); return () => window.removeEventListener("scroll", handleScroll); }, [handleScroll]);
  useEffect(() => { window.scrollTo(0, 0); markedRef.current = false; }, [story.id]);

  return (
    <div style={S.storyView}>
      <div style={S.storyNav}><button style={S.backBtn} onClick={onBack}>← Back to feed</button><a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" style={S.origLink}>Read original on {story.source} <ExternalLink /></a></div>
      <div ref={contentRef}>
        <div style={S.storyMeta}><span style={S.cardSrc}>{story.source}</span><span style={S.cardTime}>{story.readTime}</span><span style={S.cardCat}>{story.category}</span></div>
        <h1 style={S.storyTitle}>{story.product}: {story.tagline}</h1>
        <div style={S.storyTags}>{story.tags.map((t) => <span key={t} style={S.tag}>{t}</span>)}</div>
        <div style={S.summBox}><div style={S.summLabel}>Overview</div><p style={S.summText}>{story.summary}</p></div>
        <div style={{ marginBottom: 40 }}>
          <h3 style={S.bdTitle}>Full Breakdown</h3>
          {story.breakdown.map((sec, i) => <div key={i} style={S.bdCard}><div style={S.bdNum}>{String(i + 1).padStart(2, "0")}</div><h4 style={S.bdHeading}>{sec.heading}</h4><p style={S.bdBody}>{sec.body}</p></div>)}
        </div>
        <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" style={S.readOrigBtn}>Read the original article on {story.source} <ExternalLink /></a>
        {!isRead && !markedRef.current && <div style={S.scrollHint}>↓ Keep scrolling to mark as read</div>}
        {(isRead || markedRef.current) && <div style={S.readConfirm}><CheckCircle /> Story marked as read</div>}
        {nextStory && (<div style={S.nextWrap}>
          <div style={S.nextLabel}>Up next</div>
          <div style={S.nextCard} onClick={onNextStory}>
            <div style={{ flex: 1 }}>
              <div style={S.nextMeta}><span style={S.cardSrc}>{nextStory.source}</span><span style={S.cardTime}>{nextStory.readTime}</span></div>
              <h3 style={S.nextTitle}>{nextStory.product}: {nextStory.tagline}</h3>
              <p style={S.nextExcerpt}>{nextStory.summary.slice(0, 120)}...</p>
            </div>
            <div style={S.nextArrow}>→</div>
          </div>
        </div>)}
        {!nextStory && <div style={S.allDoneStory}>You've read all available stories. Nice work! 🎉</div>}
      </div>
    </div>
  );
}

function DashboardView({ stats, onBack }) {
  const skills = [{ name: "Strategy", pct: stats.challengesCorrect > 0 ? 100 : 0 },{ name: "Growth", pct: 0 },{ name: "Monetization", pct: 0 },{ name: "UX", pct: 0 },{ name: "Analytics", pct: 0 }];
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div style={S.dashView}><button style={S.backBtn} onClick={onBack}>← Back to feed</button>
      <h1 style={S.dashTitle}>Your Progress</h1><p style={S.dashSub}>Track your daily product learning habit.</p>
      <div style={S.statsGrid}>
        <SC icon={<Flame />} value={stats.streak} label="Day Streak" accent />
        <SC icon={<BookOpen />} value={stats.storiesRead} label="Stories Read" />
        <SC icon={<Target />} value={stats.challengesAttempted} label="Challenges Done" />
        <SC icon={<Target />} value={stats.accuracy !== null ? `${stats.accuracy}%` : "—"} label="Accuracy" />
      </div>
      <div style={S.skillSec}><h3 style={S.skillTitle}>Skill Breakdown</h3><p style={S.skillSub}>Accuracy per skill area</p>
        <div style={S.skillBars}>{skills.map((s) => <div key={s.name} style={S.skillRow}><span style={S.skillName}>{s.name}</span><div style={S.skillTrack}><div style={{ ...S.skillFill, width: `${s.pct}%`, background: s.pct > 0 ? "#C0440E" : "#E8E4DF" }} /></div><span style={S.skillPct}>{s.pct > 0 ? `${s.pct}%` : "—"}</span></div>)}</div>
      </div>
    </div>
  );
}
function SC({ icon, value, label, accent }) {
  return (<div style={{ ...S.statCard, ...(accent ? S.statCardAcc : {}) }}><div style={{ marginBottom: 10 }}>{icon}</div><div style={{ ...S.statVal, ...(accent ? { color: "#C0440E" } : {}) }}>{value}</div><div style={S.statLabel}>{label}</div></div>);
}

const S = {
  app: { fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: "#FAF8F5", color: "#1A1714", minHeight: "100vh", WebkitFontSmoothing: "antialiased" },
  header: { borderBottom: "1px solid #E8E4DF", background: "rgba(250,248,245,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 },
  logo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  logoMark: { width: 30, height: 30, background: "#C0440E", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 17, fontStyle: "italic" },
  logoText: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 21, letterSpacing: -0.3 },
  nav: { display: "flex", alignItems: "center", gap: 24 },
  navLink: { textDecoration: "none", color: "#6B6560", fontSize: 13.5, fontWeight: 500, cursor: "pointer", transition: "color 0.2s" },
  navActive: { color: "#C0440E" },
  headerDate: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9C9590" },
  hero: { maxWidth: 1120, margin: "0 auto", padding: "48px 24px 32px" },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#C0440E", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
  pulseDot: { width: 6, height: 6, background: "#C0440E", borderRadius: "50%", display: "inline-block" },
  heroTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: 640, marginBottom: 14 },
  heroEm: { fontStyle: "italic", color: "#C0440E" },
  heroSub: { fontSize: 15.5, color: "#6B6560", maxWidth: 500, lineHeight: 1.65 },
  streakWrap: { maxWidth: 1120, margin: "0 auto", padding: "0 24px 32px" },
  streakInner: { background: "#F3F0EB", border: "1px solid #E8E4DF", borderRadius: 10, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 },
  streakLeft: { display: "flex", alignItems: "center", gap: 14 },
  streakNum: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: "#C0440E", lineHeight: 1 },
  streakLabel: { fontSize: 13, color: "#6B6560" },
  streakDays: { display: "flex", gap: 5 },
  streakDot: { width: 28, height: 28, borderRadius: 6, border: "1.5px solid #E8E4DF", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#9C9590" },
  streakDotFilled: { background: "#C0440E", borderColor: "#C0440E", color: "white" },
  streakDotToday: { borderColor: "#C0440E", color: "#C0440E", fontWeight: 600 },
  sectionDivider: { maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 24 },
  divLine: { flex: 1, height: 1, background: "#E8E4DF" },
  divText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#9C9590", whiteSpace: "nowrap" },
  feed: { maxWidth: 1120, margin: "0 auto", padding: "0 24px 60px", display: "grid", gap: 24 },
  card: { background: "white", border: "1px solid #E8E4DF", borderRadius: 10, padding: "28px 30px", cursor: "pointer", transition: "box-shadow 0.25s", position: "relative" },
  cardFeat: { background: "#1A1714", color: "#FAF8F5", borderColor: "transparent" },
  readBadge: { position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#2E7D32", background: "#E8F5E9", padding: "4px 10px", borderRadius: 20 },
  cardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 },
  cardMeta: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  cardSrc: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9C9590", background: "#EDEAE5", padding: "3px 9px", borderRadius: 4 },
  cardSrcF: { color: "rgba(250,248,245,0.55)", background: "rgba(250,248,245,0.1)" },
  cardTime: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9C9590" },
  cardTimeF: { color: "rgba(250,248,245,0.4)" },
  cardCat: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#C0440E", background: "#FFF0EB", padding: "3px 9px", borderRadius: 4 },
  cardCatF: { color: "#FF8A65", background: "rgba(255,138,101,0.12)" },
  cardTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, fontWeight: 400, lineHeight: 1.25, marginBottom: 10 },
  cardTitleF: { fontSize: 26 },
  cardExcerpt: { fontSize: 14.5, color: "#6B6560", lineHeight: 1.6, marginBottom: 16, maxWidth: 620 },
  cardExcerptF: { color: "rgba(250,248,245,0.65)" },
  cardTags: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 },
  tag: { fontSize: 11.5, fontWeight: 500, color: "#6B6560", background: "#F3F0EB", padding: "4px 11px", borderRadius: 16, border: "1px solid #F0ECE7" },
  tagF: { color: "rgba(250,248,245,0.6)", background: "rgba(250,248,245,0.07)", borderColor: "rgba(250,248,245,0.1)" },
  cardFoot: { paddingTop: 16, borderTop: "1px solid #F0ECE7" },
  cardFootF: { borderTopColor: "rgba(250,248,245,0.1)" },
  cardPrompt: { fontSize: 13, color: "#C0440E", fontWeight: 500 },
  cardPromptF: { color: "#FF8A65" },
  loadMoreBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "white", border: "2px dashed #E8E4DF", borderRadius: 10, padding: "20px 32px", fontSize: 15, fontWeight: 600, color: "#C0440E", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%" },
  allCaughtUp: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#F3F0EB", border: "1px solid #E8E4DF", borderRadius: 10, padding: "18px 24px", fontSize: 14, color: "#6B6560", fontWeight: 500 },
  chalWrap: { background: "#F1AC91", border: "1px solid rgba(192,68,14,0.15)", borderRadius: 10, padding: "32px 30px 36px", position: "relative", overflow: "hidden" },
  chalMeta: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  chalBadge: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C0440E", background: "rgba(192,68,14,0.12)", padding: "4px 10px", borderRadius: 4 },
  chalLinked: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(26,23,20,0.5)" },
  chalTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 400, color: "#1A1714", lineHeight: 1.2 },
  chalQBox: { background: "rgba(255,255,255,0.45)", border: "1px solid rgba(192,68,14,0.12)", borderRadius: 10, padding: "22px 24px", marginBottom: 20 },
  chalQText: { fontSize: 15, lineHeight: 1.65, color: "#1A1714", fontWeight: 400 },
  chalOpts: { display: "grid", gap: 10, marginBottom: 24 },
  chalOpt: { display: "flex", alignItems: "flex-start", gap: 14, background: "rgba(255,255,255,0.55)", border: "2px solid rgba(192,68,14,0.12)", borderRadius: 10, padding: "16px 20px", cursor: "pointer", transition: "all 0.2s", textAlign: "left", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.55, position: "relative", width: "100%", color: "#1A1714" },
  optSel: { borderColor: "#C0440E", background: "rgba(255,255,255,0.75)" },
  optCorrect: { borderColor: "#2E7D32", background: "#E8F5E9", cursor: "default" },
  optWrong: { borderColor: "#C0440E", background: "#FFF0EB", cursor: "default" },
  optDis: { opacity: 0.45, cursor: "default" },
  optLetter: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: "#6B6560", background: "rgba(255,255,255,0.5)", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  optText: { flex: 1 },
  optIcon: { flexShrink: 0, marginTop: 2 },
  submitBtn: { background: "#C0440E", color: "white", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%" },
  submitDis: { opacity: 0.4, cursor: "not-allowed" },
  resBanner: { display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderRadius: "10px 10px 0 0", border: "2px solid" },
  expContent: { background: "white", border: "2px solid #E8E4DF", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "24px 26px" },
  expTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, fontWeight: 400, marginBottom: 10 },
  expText: { fontSize: 14.5, color: "#6B6560", lineHeight: 1.7 },
  storyView: { maxWidth: 780, margin: "0 auto", padding: "32px 24px 80px" },
  storyNav: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 },
  backBtn: { background: "none", border: "1px solid #E8E4DF", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#6B6560", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  origLink: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#C0440E", textDecoration: "none" },
  storyMeta: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  storyTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.015em", marginBottom: 20 },
  storyTags: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 32 },
  summBox: { background: "#F3F0EB", border: "1px solid #E8E4DF", borderRadius: 8, padding: "24px 28px", marginBottom: 40 },
  summLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9C9590", marginBottom: 10 },
  summText: { fontSize: 15, lineHeight: 1.7, color: "#1A1714" },
  bdTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, fontWeight: 400, marginBottom: 24 },
  bdCard: { background: "white", border: "1px solid #E8E4DF", borderRadius: 8, padding: "24px 28px", marginBottom: 16 },
  bdNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#C0440E", marginBottom: 8 },
  bdHeading: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, fontWeight: 400, marginBottom: 10, lineHeight: 1.3 },
  bdBody: { fontSize: 14.5, color: "#6B6560", lineHeight: 1.7 },
  readOrigBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: "#1A1714", color: "#FAF8F5", padding: "14px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none", marginBottom: 32 },
  scrollHint: { textAlign: "center", fontSize: 12, color: "#9C9590", fontFamily: "'JetBrains Mono', monospace", padding: "40px 0 20px" },
  readConfirm: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "#2E7D32", background: "#E8F5E9", padding: "14px 20px", borderRadius: 8, marginTop: 32 },
  nextWrap: { marginTop: 40, paddingTop: 32, borderTop: "1px solid #E8E4DF" },
  nextLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#9C9590", marginBottom: 14 },
  nextCard: { background: "white", border: "1px solid #E8E4DF", borderRadius: 10, padding: "24px 28px", cursor: "pointer", display: "flex", alignItems: "center", gap: 20, transition: "box-shadow 0.25s" },
  nextMeta: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  nextTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, fontWeight: 400, lineHeight: 1.25, marginBottom: 8 },
  nextExcerpt: { fontSize: 13.5, color: "#6B6560", lineHeight: 1.55 },
  nextArrow: { fontSize: 24, color: "#C0440E", fontWeight: 300, flexShrink: 0 },
  allDoneStory: { marginTop: 40, paddingTop: 32, borderTop: "1px solid #E8E4DF", textAlign: "center", fontSize: 15, color: "#6B6560" },
  dashView: { maxWidth: 780, margin: "0 auto", padding: "32px 24px 80px" },
  dashTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 400, marginBottom: 8 },
  dashSub: { fontSize: 15, color: "#6B6560", marginBottom: 36 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 40 },
  statCard: { background: "white", border: "1px solid #E8E4DF", borderRadius: 10, padding: "22px 20px", textAlign: "center" },
  statCardAcc: { background: "#FFF9F7", borderColor: "rgba(192,68,14,0.2)" },
  statVal: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, lineHeight: 1, marginBottom: 6, color: "#1A1714" },
  statLabel: { fontSize: 12.5, color: "#9C9590", fontWeight: 500 },
  skillSec: { background: "white", border: "1px solid #E8E4DF", borderRadius: 10, padding: "28px 30px" },
  skillTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontWeight: 400, marginBottom: 4 },
  skillSub: { fontSize: 13, color: "#9C9590", marginBottom: 24 },
  skillBars: { display: "grid", gap: 16 },
  skillRow: { display: "flex", alignItems: "center", gap: 14 },
  skillName: { fontSize: 13, fontWeight: 500, width: 100, color: "#6B6560" },
  skillTrack: { flex: 1, height: 8, background: "#F3F0EB", borderRadius: 4, overflow: "hidden" },
  skillFill: { height: "100%", borderRadius: 4, transition: "width 0.6s ease" },
  skillPct: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#9C9590", width: 36, textAlign: "right" },
  footer: { borderTop: "1px solid #E8E4DF", padding: "36px 24px", textAlign: "center" },
  footerTagline: { fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 17, color: "#6B6560", marginBottom: 6 },
  footerCopy: { fontSize: 11, color: "#9C9590", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.02em" },
};
