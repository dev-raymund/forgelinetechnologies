/* ==========================================================================
   eContent — site content.

   ⚠ EVERYTHING IN THIS FILE IS PLACEHOLDER. Names, numbers, quotes and client
   logos are structural stand-ins so the layout can be reviewed — none of it is
   a real claim. Replace with facts you can substantiate before this goes live;
   published stats and testimonials that aren't real are a legal problem, not a
   copywriting one. Delete <PlaceholderNotice /> from the pages once it's real.
   ========================================================================== */

export const brand = {
  name: "eContent",
  tagline: "Software that ships, support that stays",
  blurb:
    "We design, build and maintain websites, web apps and automation for businesses that need the thing working — not another deck about it.",
  email: "hello@example.com",
  phone: "+63 000 000 0000",
  location: "Philippines · working with clients worldwide",
};

export const nav = [
  { href: "/econtent", label: "Home" },
  { href: "/econtent/about", label: "About" },
  { href: "/econtent/solutions", label: "Solutions" },
  { href: "/econtent/blog", label: "Blog" },
  { href: "/econtent/podcast", label: "Podcast" },
  { href: "/econtent/contact", label: "Contact" },
];

export const stats = [
  { value: "120+", label: "Projects delivered" },
  { value: "60+", label: "Clients supported" },
  { value: "8 yrs", label: "Building for the web" },
  { value: "24/7", label: "Monitoring & support" },
];

import type { IconName } from "./_components/ec-icon";

export type Service = {
  slug: string;
  title: string;
  summary: string;
  features: string[];
  icon: IconName;
};

export const services: Service[] = [
  {
    slug: "web-development",
    icon: "build",
    title: "Websites & web apps",
    summary:
      "Marketing sites, portals and internal tools — designed, built and launched end to end, on a stack you can hand to anyone later.",
    features: [
      "WordPress, Shopify and headless builds",
      "Custom React and Next.js applications",
      "Accessibility and Core Web Vitals passes",
      "Migration off legacy or abandoned sites",
    ],
  },
  {
    slug: "ai-automation",
    icon: "automate",
    title: "AI automation & CRM",
    summary:
      "Take the repetitive work out of the day — intake, routing, follow-up and reporting wired into the tools your team already opens.",
    features: [
      "Lead capture and routing workflows",
      "CRM setup, cleanup and integration",
      "Document and email triage assistants",
      "Reporting pipelines and dashboards",
    ],
  },
  {
    slug: "custom-saas",
    icon: "saas",
    title: "Custom SaaS builds",
    summary:
      "From a validated idea to a product people can pay for: schema, auth, billing, admin — the unglamorous half that decides whether it survives.",
    features: [
      "Multi-tenant architecture and auth",
      "Subscriptions and metered billing",
      "Admin tooling and role management",
      "Staged rollout with real monitoring",
    ],
  },
  {
    slug: "care-plans",
    icon: "care",
    title: "Hosting, SEO & support",
    summary:
      "The part most agencies drop after launch. Patches, backups, uptime checks and search health, handled on a schedule you can see.",
    features: [
      "Managed hosting and daily backups",
      "Security patching and uptime alerts",
      "Technical SEO and schema fixes",
      "A named person who answers you",
    ],
  },
];

export const clients = [
  "Client One",
  "Client Two",
  "Client Three",
  "Client Four",
  "Client Five",
  "Client Six",
  "Client Seven",
  "Client Eight",
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

/* Placeholder copy — swap for quotes you have written permission to publish. */
export const testimonials: Testimonial[] = [
  {
    quote:
      "Placeholder testimonial. Two or three sentences from a real client about a specific problem and what changed after — concrete beats glowing every time.",
    name: "Client Name",
    role: "Operations Lead, Company Name",
  },
  {
    quote:
      "Placeholder testimonial. Ask for the number they care about: hours saved, tickets closed, load time, conversion — whatever they were actually measuring.",
    name: "Client Name",
    role: "Founder, Company Name",
  },
  {
    quote:
      "Placeholder testimonial. Quotes about responsiveness and follow-through do more work than quotes about design taste.",
    name: "Client Name",
    role: "Marketing Manager, Company Name",
  },
];

export type Project = {
  slug: string;
  title: string;
  category: string;
  summary: string;
};

export const projects: Project[] = [
  {
    slug: "project-one",
    title: "Project One",
    category: "Web app",
    summary:
      "Placeholder case study. One line on the problem, one on what was built, one on the measurable result.",
  },
  {
    slug: "project-two",
    title: "Project Two",
    category: "E-commerce",
    summary:
      "Placeholder case study. Name the stack and the constraint — budget, deadline, legacy system — that shaped the build.",
  },
  {
    slug: "project-three",
    title: "Project Three",
    category: "Automation",
    summary:
      "Placeholder case study. Finish with the outcome the client would repeat out loud to someone else.",
  },
];

export type Episode = {
  number: number;
  title: string;
  summary: string;
  date: string;
  duration: string;
};

export const episodes: Episode[] = [
  {
    number: 3,
    title: "Episode title goes here",
    summary: "Placeholder episode description — what the conversation covered and who it was with.",
    date: "2026-08-28",
    duration: "42 min",
  },
  {
    number: 2,
    title: "Episode title goes here",
    summary: "Placeholder episode description — keep it to a sentence or two on the show notes page.",
    date: "2026-08-14",
    duration: "37 min",
  },
  {
    number: 1,
    title: "Episode title goes here",
    summary: "Placeholder episode description for the pilot episode.",
    date: "2026-07-31",
    duration: "51 min",
  },
];

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
};

export const articles: Article[] = [
  {
    slug: "article-one",
    title: "Article title goes here",
    excerpt:
      "Placeholder excerpt. Two lines that tell someone whether the piece is worth their next five minutes.",
    date: "2026-09-01",
    readingTime: "6 min read",
  },
  {
    slug: "article-two",
    title: "Article title goes here",
    excerpt: "Placeholder excerpt for the second article in the list.",
    date: "2026-08-19",
    readingTime: "4 min read",
  },
  {
    slug: "article-three",
    title: "Article title goes here",
    excerpt: "Placeholder excerpt for the third article in the list.",
    date: "2026-08-05",
    readingTime: "8 min read",
  },
];

export const values = [
  {
    title: "We finish",
    body: "A build is done when it is live, monitored and handed over — not when the last ticket is closed.",
  },
  {
    title: "You own it",
    body: "Your repo, your hosting, your accounts. Nothing is held hostage to keep you on a retainer.",
  },
  {
    title: "Plain answers",
    body: "Estimates you can plan around and a straight answer when something is a bad idea, including ours.",
  },
];

export const processSteps = [
  { n: "01", title: "Scope", body: "A short paid discovery: what you need, what it costs, what it does not include." },
  { n: "02", title: "Design", body: "Wireframes and a design pass you sign off before anything gets built." },
  { n: "03", title: "Build", body: "Weekly demos on a staging URL. No black-box months." },
  { n: "04", title: "Launch & care", body: "Migration, monitoring and a support plan with a named contact." },
];

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
