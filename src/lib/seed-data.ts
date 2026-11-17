import type { SiteContent } from "./types";

/**
 * First-run content for the portfolio.
 *
 * Everything here is copied into SQLite the first time the app boots and can
 * then be edited from /admin. Keeping it in code means a fresh container has a
 * complete, presentable site with no manual setup step.
 */

export const SEED_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Senior Project Manager · Digital Transformation",
    headline: "I turn complex transformation programmes into predictable delivery.",
    subheadline:
      "Senior Project Manager with 10+ years leading Agile and waterfall delivery across fintech, supply chain and enterprise IT. I build the operating rhythm — clear scope, honest reporting, decisive stakeholder alignment — that lets cross-functional teams ship on time and on budget.",
    primaryCtaLabel: "View Key Projects",
    primaryCtaHref: "#projects",
    secondaryCtaLabel: "Get in Touch",
    secondaryCtaHref: "#contact",
    portraitUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80",
    portraitBadge: "Available for Q3 engagements",
  },

  about: {
    heading: "Delivery leadership, grounded in evidence",
    paragraphs: [
      "I run programmes the way a good operations lead runs a plant: measure what matters, remove the blockers nobody owns, and report the truth early enough that it is still useful. Over the past decade I have taken ownership of portfolios worth more than $12M, most of them mid-flight, and brought them back to a delivery cadence the business could plan against.",
      "My approach is deliberately unglamorous. Establish a single source of truth for scope and status. Make dependencies visible before they become escalations. Give every stakeholder a predictable cadence of communication so nobody is surprised. Then let the specialists do the work they were hired for.",
      "I work comfortably between the boardroom and the backlog. That means translating a commercial objective into an executable roadmap for engineers, and translating technical risk back into language a CFO can act on — with a recommendation attached, not just a status update.",
    ],
    certifications: [
      "PMP",
      "Certified ScrumMaster (CSM)",
      "PRINCE2 Practitioner",
      "SAFe 6 Agilist",
      "ITIL 4 Foundation",
    ],
    principles: [
      {
        title: "Clarity before velocity",
        description:
          "A team moving fast in the wrong direction is the most expensive thing in the programme. I fix scope and definition of done first, then optimise throughput.",
      },
      {
        title: "No surprise escalations",
        description:
          "Risks are raised when they are cheap to fix. Weekly written status, a live RAID log, and one escalation path that everyone understands.",
      },
      {
        title: "Decisions have owners",
        description:
          "Every open decision gets a name and a date. Ambiguity in ownership is the single most common cause of slippage I inherit.",
      },
      {
        title: "Protect the team's focus",
        description:
          "I absorb stakeholder churn so delivery teams get uninterrupted time. Fewer context switches, better estimates, less rework.",
      },
    ],
  },

  metrics: [
    {
      value: "98%",
      label: "On-Time Delivery",
      detail: "Across 35+ enterprise engagements since 2015",
    },
    {
      value: "$12M+",
      label: "Budgets Managed",
      detail: "Portfolio value delivered within ±5% of forecast",
    },
    {
      value: "35+",
      label: "Enterprise Projects",
      detail: "Fintech, supply chain, ERP and AI programmes",
    },
    {
      value: "10+",
      label: "Years Experience",
      detail: "Leading cross-functional teams of up to 60 people",
    },
  ],

  contact: {
    heading: "Let's talk about your next programme",
    intro:
      "Whether you are rescuing a stalled initiative, standing up a new delivery function, or need a senior PM to own a high-visibility launch — I would like to hear about it. I reply to every enquiry within one business day.",
    email: "marijana.mandic@example.com",
    phone: "+381 60 123 4567",
    location: "Belgrade, Serbia · Remote across EU & US time zones",
    linkedinUrl: "https://www.linkedin.com/in/marijana-mandic-pmp",
    availability: "Currently accepting new engagements from Q3 2026.",
  },
};

/** Sample case studies inserted alongside the copy on first run. */
export const SEED_PROJECTS = [
  {
    slug: "enterprise-erp-migration",
    title: "Enterprise ERP Migration",
    category: "Digital Transformation",
    client: "Nordwind Logistics · 4,000 employees",
    summary:
      "Consolidated four legacy ERP systems onto a single SAP S/4HANA platform across nine countries, delivered in three waves with no interruption to customer operations.",
    outcome: "Reduced operational costs by 24%",
    challenge:
      "Nordwind had grown through acquisition, leaving four disconnected ERP systems, three chart-of-accounts structures and no reliable consolidated reporting. Month-end close took 19 days, and the finance team reconciled intercompany balances by hand in spreadsheets. Two previous migration attempts had been abandoned after overspending on discovery, so executive trust in the programme was low and the CFO had publicly committed to a hard regulatory reporting deadline.",
    strategy:
      "I restructured delivery around three value-sequenced waves instead of the original single big-bang cutover, so each wave delivered a measurable finance benefit before the next began. Wave one moved the highest-volume country and proved the integration pattern. From there I ran a fixed weekly governance cadence: a joint steering committee with one decision per agenda item, a visible RAID log, and a data-migration workstream owned by a dedicated analyst rather than shared with the build team. Cutover rehearsals were run twice per wave, including a full rollback drill, and go/no-go criteria were agreed with the CFO in advance so the decision could not drift under pressure.",
    tools: ["Jira", "Confluence", "SAP Activate", "MS Project", "Power BI", "Azure DevOps"],
    results: [
      "Consolidated 4 ERP systems into 1 platform across 9 countries",
      "Reduced operational costs by 24% — approximately $3.1M annually",
      "Cut month-end close from 19 days to 6 days",
      "Delivered all three waves within 4% of the approved $6.2M budget",
      "Zero unplanned downtime during any of the three cutover weekends",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    year: "2022 — 2024",
    featured: true,
  },
  {
    slug: "fintech-mobile-app-launch",
    title: "FinTech Mobile App Launch",
    category: "Product Delivery",
    client: "Vela Financial · Series B payments platform",
    summary:
      "Took a stalled mobile banking product from 40% feature-complete to public launch in 22 weeks, covering KYC onboarding, biometric authentication and instant payments.",
    outcome: "Grew to 180K active users in 9 months",
    challenge:
      "Vela had 14 engineers building a consumer payments app with no single owner of scope, two competing design systems and a release train that shipped whenever it was ready. After nine months the app was 40% complete with no launch date, and the board had signalled that further funding depended on a credible path to market. Regulatory sign-off for the payments licence also hung on a compliance feature set that had not been scheduled.",
    strategy:
      "I started with a two-week delivery audit that produced a brutally honest scope baseline: what was actually built, what remained, and what was optional. I cut the launch scope by roughly 30%, deferring analytics dashboards and a referral engine that had no bearing on licence approval. The remaining work was organised into six two-week sprints against a single prioritised backlog, with compliance features scheduled first because they were on the critical path. I introduced release checkpoints with the regulator's requirements written as testable acceptance criteria, and set up a weekly demo for the executive sponsor so progress was visible rather than reported.",
    tools: ["Jira", "Confluence", "Figma", "Bitrise", "Slack", "Amplitude"],
    results: [
      "Launched publicly in 22 weeks from a 40% complete baseline",
      "180,000 active users within the first 9 months",
      "Passed regulatory review on first submission, no remediation round",
      "Increased sprint predictability from 61% to 94% of committed points",
      "Reduced critical production defects by 71% versus the prior release process",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    year: "2023 — 2024",
    featured: true,
  },
  {
    slug: "global-supply-chain-optimization",
    title: "Global Supply Chain Optimization",
    category: "Operations & Logistics",
    client: "Meridian Retail Group · 1,200 retail locations",
    summary:
      "Rebuilt demand forecasting and inventory replenishment across 1,200 stores and 3 distribution centres, replacing spreadsheet planning with an automated forecasting platform.",
    outcome: "Cut stockouts by 38% and freed $4.5M in working capital",
    challenge:
      "Meridian planned replenishment in 200+ regional spreadsheets with no shared demand signal. Store-level stockouts on high-margin lines ran at 11%, while slow-moving inventory accumulated in three distribution centres. Peak season planning was effectively a manual negotiation between regional managers, and the business had no way to model the cost of a promotion before committing to it.",
    strategy:
      "I ran the programme as three parallel workstreams with a shared dependency map: data foundation, forecasting engine, and store-level change management. The data workstream came first and deliberately included six weeks of cleansing before any model training, because the existing SKU and location masters disagreed across regions. Forecasting was deployed to a pilot region of 80 stores, tuned for one full quarter, then rolled out in clusters so each wave could benefit from the last. I paired every technical rollout with in-store training and a named regional super-user, which is what made adoption stick where previous tooling had been abandoned.",
    tools: ["Asana", "Confluence", "Power BI", "SQL Server", "Azure Data Factory", "Excel (transition)"],
    results: [
      "Reduced store-level stockouts from 11% to 6.8%",
      "Freed $4.5M in working capital through inventory rebalancing",
      "Cut forecast error (MAPE) from 27% to 14% across pilot categories",
      "Replaced 200+ planning spreadsheets with a single planning platform",
      "Improved peak-season fulfilment rate by 19 percentage points",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    year: "2021 — 2023",
    featured: true,
  },
  {
    slug: "ai-customer-support-automation",
    title: "AI Customer Support Automation",
    category: "AI & Automation",
    client: "Helio Telecom · 2.4M subscribers",
    summary:
      "Introduced an LLM-assisted support platform that resolves common subscriber requests automatically and routes complex cases to agents with full context.",
    outcome: "Deflected 46% of inbound tickets, saving $1.8M annually",
    challenge:
      "Helio's support organisation handled 90,000 tickets a month with a first-response time averaging 14 hours and a 22% agent attrition rate driven largely by repetition. A previous chatbot pilot had been withdrawn after six weeks because it answered confidently and incorrectly, eroding customer trust and forcing agents to re-do work. Any new attempt had to clear a higher bar for accuracy and had to be auditable for regulated complaint handling.",
    strategy:
      "I framed the programme as a controlled automation of the top ten request types rather than an open-ended chatbot, which made accuracy measurable and contained the blast radius of failure. Each intent was released only after clearing a 95% accuracy threshold on a held-out set of 2,000 historical tickets, with automatic escalation to a human on any low-confidence response. I ran the rollout in parallel with the existing process for eight weeks so results were directly comparable, and involved frontline agents in reviewing transcripts from week one — their objections shaped the escalation rules and, more importantly, they became advocates rather than resisters.",
    tools: ["Linear", "Confluence", "Zendesk", "Python", "OpenAI API", "Grafana"],
    results: [
      "Deflected 46% of inbound tickets without human handling",
      "Reduced average first-response time from 14 hours to under 4 minutes",
      "Saved approximately $1.8M annually in support operating cost",
      "Improved CSAT from 3.6 to 4.4 out of 5 on automated interactions",
      "Cut agent attrition from 22% to 13% by removing repetitive workload",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    year: "2024 — 2025",
    featured: true,
  },
];
