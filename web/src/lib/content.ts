/* ==========================================================================
   Forgeline marketing content.

   Facts are sourced from the existing forgelinetechnologies.com — pricing,
   inclusions, stats, FAQ substance, founder background. Nothing is invented:
   no testimonials, no award claims, no outcome percentages, no client logos
   beyond the projects actually in the works table.

   Positioning note: Forgeline is the focused web/digital-product engineering
   company; TechzQuad is the broader business-technology and IT partner. That
   distinction is stated in the partnership block and should stay visible in
   the copy rather than being asserted once and forgotten.

   Kept as typed data rather than hard-coded JSX so a CMS can replace the
   export later without touching a component.
   ========================================================================== */

export const site = {
  name: "Forgeline Technologies",
  short: "Forgeline",
  url: "https://www.forgelinetechnologies.com",
  email: "hello@forgelinetechnologies.com",
  founder: "Raymund Hermoso",
  founderRole: "Founder & Lead Developer",
  tagline: "Web software, engineered end to end.",
  description:
    "A senior-led web engineering studio building websites, web applications and e-commerce — front-end to back-end, at a fixed price agreed before development starts.",
} as const;

/* ---------------------------------------------------------------- hero --- */

export const hero = {
  eyebrow: "Web & digital product engineering",
  headline: "Websites, web apps and online stores — engineered, not assembled.",
  lede: "Forgeline builds production web software for businesses that need the thing working, not another proposal. Front-end to back-end, scoped at a fixed price before work starts, handed over clean and owned entirely by you.",
  // The strongest line from the existing site — kept, but demoted from
  // headline to proof so the hero leads with what Forgeline actually does.
  proof: "The developer you brief is the developer who builds it.",
  spec: [
    { k: "Engagement", v: "Fixed scope, fixed price" },
    { k: "Timeline", v: "Sites 1–2 wks · Apps 4–8 wks" },
    { k: "Stack", v: "React · Node · Laravel · Shopify" },
    { k: "Handover", v: "100% code ownership" },
  ],
} as const;

/* --------------------------------------------------------------- stats --- */

/* Real figures — the live site animates these from data-to attributes. */
export const stats = [
  { value: "6+", label: "Years building", note: "Agency and enterprise" },
  { value: "17", label: "Projects shipped", note: "Live client work" },
  { value: "4", label: "Countries served", note: "AU · NZ · PH · US" },
  { value: "100%", label: "Code ownership", note: "Yours on handover" },
] as const;

/* -------------------------------------------------------- capabilities --- */

export type Capability = {
  slug: string;
  title: string;
  /** One line: what this is. */
  summary: string;
  /** Who typically buys it — answers "is this me?" */
  who: string;
  /** What the client actually receives. */
  delivers: string[];
  tags: string[];
};

export const capabilities: Capability[] = [
  {
    slug: "websites",
    title: "Websites & digital experiences",
    summary:
      "Marketing, corporate and conversion-focused sites built around how your business actually sells — from the interface through the CMS, integrations and deployment.",
    who: "Businesses whose current site loads slowly, can't be edited without a developer, or doesn't convert the traffic it already gets.",
    delivers: [
      "Design and build, desktop through mobile",
      "A CMS your team can edit without us",
      "Technical SEO, analytics and forms wired up",
      "Deployed to your hosting, with a walkthrough",
    ],
    tags: ["Next.js", "WordPress", "Tailwind"],
  },
  {
    slug: "web-applications",
    title: "Web applications",
    summary:
      "Portals, dashboards, booking systems and internal tools — the full stack, including the auth, database and admin that decide whether it survives contact with real users.",
    who: "Founders with a product to validate, and operators running a process that has outgrown spreadsheets and email.",
    delivers: [
      "Architecture and data model agreed before code",
      "Authentication, roles and an admin interface",
      "APIs and third-party service integration",
      "Deployed, monitored and documented",
    ],
    tags: ["React", "Node", "Laravel"],
  },
  {
    slug: "ecommerce",
    title: "E-commerce",
    summary:
      "Storefronts on Shopify and WooCommerce, or custom commerce where the platforms stop fitting — built around the catalogue, checkout and fulfilment you actually run.",
    who: "Retailers outgrowing a template, and businesses whose products don't fit standard variant and pricing models.",
    delivers: [
      "Catalogue, variants and custom product options",
      "Payments, shipping and tax configured",
      "Inventory and order-flow integration",
      "Performance work so checkout doesn't leak sales",
    ],
    tags: ["Shopify", "WooCommerce", "ACF"],
  },
  {
    slug: "integrations",
    title: "APIs & integrations",
    summary:
      "Engineering the connections that make a digital product work with the rest of the business — so data stops being exported, retyped and reconciled by hand.",
    who: "Teams running several systems that don't talk to each other, and products that need to read or write data elsewhere.",
    delivers: [
      "REST API design, or integration with an existing one",
      "CRM, payment and third-party service connections",
      "Scheduled syncs and webhook handling",
      "Error handling and retry logic that surfaces failures",
    ],
    tags: ["REST API", "Webhooks", "Node"],
  },
  {
    slug: "custom-software",
    title: "Custom software",
    summary:
      "When off-the-shelf software doesn't fit the way your business actually works, the system gets built around your process instead of the other way round.",
    who: "Businesses paying for a subscription tool they've had to work around, or running a critical process in a spreadsheet nobody else understands.",
    delivers: [
      "The workflow modelled as it actually runs",
      "A database designed for your data, not a generic schema",
      "Roles and permissions matched to your team",
      "Built to be extended by whoever comes next",
    ],
    tags: ["PHP", "MySQL", "MongoDB"],
  },
  {
    slug: "ongoing",
    title: "Ongoing development",
    summary:
      "Long-term engineering capacity from someone who already knows the codebase — features, fixes and technical direction without a re-onboarding cost every time.",
    who: "Companies with a live product needing steady improvement, and in-house teams needing senior capacity alongside them.",
    delivers: [
      "Agreed monthly capacity, month to month",
      "Feature work, fixes and refactoring",
      "Technical review of what's already there",
      "A named developer who answers directly",
    ],
    tags: ["Retainer", "Priority support"],
  },
];

/* --------------------------------------------------------- engagements --- */

export type Engagement = {
  slug: string;
  name: string;
  audience: string;
  price: string;
  cadence: string;
  summary: string;
  /** The problem this exists to solve. */
  solves: string;
  includes: string[];
  timeline: string;
  /** What happens once it's delivered. */
  after: string;
  featured?: boolean;
};

/* Pricing and inclusions are verbatim in substance from the live site. */
export const engagements: Engagement[] = [
  {
    slug: "web-app-build",
    name: "Web App Build",
    audience: "For founders",
    price: "$4,000",
    cadence: "project",
    summary:
      "Your idea built into a real, production-ready product — front-end to back-end.",
    solves:
      "You have a validated idea and need it built properly the first time, by someone who will still be reachable after launch.",
    includes: [
      "Discovery + scoping",
      "Front-end + back-end",
      "Auth, database, APIs",
      "Deployed + full handover",
    ],
    timeline: "4–8 weeks",
    after: "Move to Build Partner for ongoing work, or take the code and run it yourself.",
    featured: true,
  },
  {
    slug: "site-sprint",
    name: "Site Sprint",
    audience: "For small businesses",
    price: "$800",
    cadence: "project",
    summary: "A clean, fast website designed and shipped in one to two weeks.",
    solves:
      "You need a credible site live soon, without a three-month agency engagement or a template you'll be embarrassed by.",
    includes: [
      "Custom-coded or CMS-built",
      "Up to ~5 pages, responsive",
      "Lead form + basic SEO",
      "Deployed live",
    ],
    timeline: "1–2 weeks",
    after: "Add a Care Plan, or edit it yourself — the CMS is handed over with a walkthrough.",
  },
  {
    slug: "build-partner",
    name: "Build Partner",
    audience: "For ongoing work",
    price: "$1,500",
    cadence: "month",
    summary: "A dedicated developer on tap, month to month — cancel anytime.",
    solves:
      "You have continuous work but not enough to justify a hire, or an in-house team that needs senior capacity beside it.",
    includes: [
      "Ongoing features & fixes",
      "Front-end & back-end work",
      "Priority support",
      "Dedicated capacity",
    ],
    timeline: "Rolling, monthly",
    after: "Continue, pause or stop at the end of any month. No notice period.",
  },
  {
    slug: "care-plan",
    name: "Care Plan",
    audience: "For peace of mind",
    price: "$150",
    cadence: "month",
    summary: "Hosting, updates and maintenance handled so your site stays healthy.",
    solves:
      "Your site works today and you'd rather it kept working — without you being the one who notices it's down.",
    includes: [
      "Hosting, backups, monitoring",
      "Updates & security",
      "Small fixes & tweaks",
      "Monthly report",
    ],
    timeline: "Rolling, monthly",
    after: "Cancel anytime; your site and accounts stay yours either way.",
  },
];

export const smallerPieces = [
  {
    name: "Online Store",
    price: "$2,500",
    note: "Shopify or WooCommerce build — catalogue, payments and shipping configured.",
  },
  {
    name: "Speed & SEO Tune-up",
    price: "$400",
    note: "Core Web Vitals, technical SEO and the fixes that move them.",
  },
  {
    name: "Migration & Redesign",
    price: "$600",
    note: "Move platforms or refresh an existing site without losing rankings.",
  },
] as const;

/* Why fixed price is the point, rather than just a pricing mechanic. */
export const fixedPrice = {
  heading: "You know what you're buying before development starts.",
  body: "Every project begins with a free scoping call and ends with a fixed quote. Hourly billing makes a slow build someone else's profit; a fixed number makes the estimate our problem, not yours.",
  points: [
    { title: "Clear scope", body: "Written down before work begins, so \"was that included?\" never becomes a conversation." },
    { title: "Predictable cost", body: "One number, agreed up front. Changes are quoted separately, not absorbed silently into an invoice." },
    { title: "Agreed timeline", body: "A delivery window set at scoping, with weekly progress you can actually look at." },
    { title: "Fewer surprises", body: "The unknowns get found during scoping, which is the cheapest possible place to find them." },
  ],
} as const;

/* ------------------------------------------------------------- process --- */

export const process = [
  {
    n: "01",
    title: "Scope",
    body: "A free call to work out what you actually need — and what you don't. You leave with a written scope and a fixed quote, not an hourly estimate.",
  },
  {
    n: "02",
    title: "Plan",
    body: "Architecture, stack and data model agreed before any code exists, while changing your mind is still free. You approve the plan in writing.",
  },
  {
    n: "03",
    title: "Build",
    body: "Built on a staging URL you can open at any time. Weekly progress you can click through, and a direct line to the person writing the code.",
  },
  {
    n: "04",
    title: "Launch & support",
    body: "Deployed to your accounts, walked through live, handed over with the repo and credentials. Support continues if you want it — never because you're locked in.",
  },
] as const;

/* ----------------------------------------------------- differentiators --- */

export const differentiators = [
  {
    title: "You work with the developer.",
    body: "No account manager relaying messages, no junior doing the actual build. The person you brief is the person writing the code, and the person who answers when you ask why something works the way it does.",
  },
  {
    title: "Fewer layers. Faster decisions.",
    body: "In most agencies a question travels from you to sales, to a project manager, to a developer, and back. Feedback degrades at every hop. Here it's one conversation, answered the same day.",
  },
  {
    title: "Fixed scope. Fixed price.",
    body: "You know the number before work starts. Hourly billing rewards slowness; a fixed quote puts the risk of a bad estimate on us, where it belongs.",
  },
  {
    title: "Production-grade, not demo-grade.",
    body: "Built to be maintained, extended and deployed by whoever comes next — including a team that isn't us. Readable code, sane structure, no clever tricks nobody can follow.",
  },
  {
    title: "Clean handover. You own it.",
    body: "Ships to your accounts, your repo, your hosting. Full walkthrough, 100% code ownership, nothing held back as leverage to keep you on a retainer.",
  },
] as const;

/* ---------------------------------------------------------------- tech --- */

export const techPhilosophy = {
  heading: "Chosen for the problem, not the résumé.",
  body: "A WordPress site that loads in under a second beats a React rewrite nobody asked for. The stack gets justified in the scoping call, in plain terms, before anything is committed to.",
  criteria: [
    "What the project actually requires",
    "Performance under real conditions",
    "Who maintains it after handover",
    "What you already run today",
  ],
} as const;

export const techStack = [
  { group: "Frontend", items: ["Next.js", "React", "Vue", "JavaScript", "TypeScript"] },
  { group: "Backend", items: ["Laravel", "Node.js", "PHP", "REST APIs"] },
  { group: "Commerce & CMS", items: ["Shopify", "WooCommerce", "WordPress", "ACF"] },
  { group: "Infrastructure", items: ["Vercel", "Docker", "Neon"] },
  { group: "Databases", items: ["PostgreSQL", "MySQL", "MongoDB"] },
] as const;

/* --------------------------------------------------------- partnership --- */

/**
 * Deliberately describes complementarity, not hierarchy. Neither company is
 * claimed to own or control the other, and TechzQuad's own service wording is
 * not reproduced — only the broad shape of the distinction.
 */
export const partnership = {
  heading: "Part of a wider technology ecosystem.",
  name: "TechzQuad",
  url: "https://techzquad.com",
  body: "Forgeline is deliberately narrow: web and digital product engineering, done to production standard. TechzQuad works across the broader business-technology picture — IT, systems and infrastructure support. Between the two, a project that starts as a website doesn't hit a wall when it turns out to need more than one.",
  split: [
    {
      name: "Forgeline",
      role: "Web & product engineering",
      items: ["Websites", "Web applications", "E-commerce", "APIs & integrations", "Custom software"],
    },
    {
      name: "TechzQuad",
      role: "Business technology & IT",
      items: ["IT solutions & support", "Business systems", "Infrastructure", "Wider technology services"],
    },
  ],
} as const;

/* ------------------------------------------------------------- founder --- */

export const founder = {
  name: site.founder,
  role: site.founderRole,
  photo: "/assets/raymund-hermoso-photo.png",
  bio: [
    "Forgeline exists because handovers kept going badly — and the reason was almost never the code.",
    "Six years across agencies in Australia and New Zealand, plus enterprise work at PPD–ThermoFisher, made the pattern hard to miss. A client explains the problem to a salesperson. The salesperson briefs a project manager. The project manager writes a ticket for a developer who has never spoken to the client. By the time it comes back, it answers a question nobody asked.",
    "So Forgeline is built the other way round: the person responsible for the work is the person doing it. You brief the developer, agree a fixed price, and get the code handed over clean at the end.",
  ],
  credentials: ["PPD–ThermoFisher", "Agencies across AU & NZ", "6+ years full-stack"],
} as const;

/* ----------------------------------------------------------------- faq --- */

export const faqs = [
  {
    q: "What kind of projects do you build?",
    a: "Websites, web applications, e-commerce and custom software — front-end to back-end. If it runs in a browser and needs to work properly, it's in scope.",
  },
  {
    q: "Can you work with an existing website?",
    a: "Yes. Redesigns, migrations, performance work and taking over a codebase someone else started are all normal engagements. You don't need to start again to work with us.",
  },
  {
    q: "Do you build custom web applications?",
    a: "Yes — portals, dashboards, booking systems and internal tools, including the auth, database and admin behind them. Architecture is agreed before any code is written.",
  },
  {
    q: "I'm not technical — can you still help?",
    a: "Absolutely. We translate what's in your head into a clear plan and handle the technical side end to end. No jargon required.",
  },
  {
    q: "How does your fixed-price process work?",
    a: "A free scoping call, then a written scope and a fixed quote. You approve it before work starts. Changes get quoted separately rather than appearing on an invoice later.",
  },
  {
    q: "How long does a project usually take?",
    a: "A Site Sprint runs one to two weeks; a Web App Build four to eight. Both are confirmed at scoping rather than estimated optimistically and revised later.",
  },
  {
    q: "How soon can we start?",
    a: "Usually within a week, depending on the queue. Book a scoping call and we'll confirm timing.",
  },
  {
    q: "Can you work with our internal team?",
    a: "Yes. Build Partner exists for exactly that — dedicated senior capacity alongside an in-house team, month to month.",
  },
  {
    q: "Do you provide maintenance after launch?",
    a: "Care Plan covers hosting, backups, monitoring, updates and small fixes. Larger ongoing work runs through Build Partner. Neither is compulsory.",
  },
  {
    q: "Who owns the website and code?",
    a: "You do — 100%. Everything ships to your accounts with a full handover and a short walkthrough. Nothing is held back as leverage.",
  },
  {
    q: "How does Forgeline relate to TechzQuad?",
    a: "They're partner companies with different focus. Forgeline handles web and digital product engineering; TechzQuad covers the broader business-technology and IT picture. If a project needs both, that's straightforward rather than a subcontract.",
  },
] as const;

/* ----------------------------------------------------------------- cta --- */

export const cta = {
  heading: "Tell us what you're building.",
  body: "An idea that needs building, a site that needs fixing, an application that needs a developer who'll still be there in six months — start with a free 20-minute scoping call. We reply within one business day, and we'll say so plainly if it isn't a good fit.",
} as const;

export const contactCopy = {
  heading: "Tell us what you're building.",
  lede: "Send a few details about the project. We'll review the scope and come back with the next step — usually a short call and a fixed quote.",
  formNote:
    "The more you can say about the problem, the more useful the first call is. If we're not the right fit, we'll say so and point you somewhere better.",
  privacy:
    "We reply within one business day. No newsletter, no sales sequence — your details are used to answer this enquiry.",
} as const;

/* -------------------------------------------------------------- nav ------ */

export const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
] as const;
