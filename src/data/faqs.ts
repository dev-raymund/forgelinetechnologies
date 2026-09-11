/**
 * Buyer-focused FAQ.
 *
 * The previous site's FAQ answered five easy questions and avoided the ones
 * that decide a sale — price, ownership, and who actually writes the code.
 * These answer them directly. An FAQ that dodges reads as evasive, which
 * costs more trust than a blunt answer ever does.
 *
 * Answers are plain strings so they can be rendered into FAQPage structured
 * data without stripping markup.
 */

export type Faq = {
  question: string;
  answer: string;
};

export const faqs: Faq[] = [
  {
    question: "What does Forgeline build?",
    answer:
      "Websites, web applications, e-commerce storefronts, custom software, and the APIs and integrations that connect them. If it runs in a browser and a business depends on it, it is in scope.",
  },
  {
    question: "Who actually writes the code?",
    answer:
      "Raymund Hermoso, the founder. You talk to the developer building your project, not an account manager relaying messages to one. That is the whole point of the studio, and it is why the client list is deliberately not enormous.",
  },
  {
    question: "How does fixed-price development work?",
    answer:
      "Scope is agreed before any code is written, and the price is fixed against that scope. You approve a number and a plan, then the number does not move unless you ask for something that was not in the plan — in which case you get a new fixed price for that addition before it is built.",
  },
  {
    question: "Who owns the code?",
    answer:
      "You do. All of it, on handover — repository, accounts and documentation. There is no licence to keep paying, no proprietary page builder holding your content hostage, and no requirement to stay for support.",
  },
  {
    question: "Can you work with an existing website?",
    answer:
      "Yes. Taking over an existing build, fixing one that was left unfinished, migrating a site between platforms, or making a slow one fast are all normal work. You do not have to start again to get help.",
  },
  {
    question: "Can you build a custom web application?",
    answer:
      "Yes — portals, dashboards, booking systems, internal tools and SaaS products. Talk Global Study is a live example: a student-to-university matching platform with a REST API behind the search, listing and enquiry flows.",
  },
  {
    question: "Do you work with Shopify and WooCommerce?",
    answer:
      "Both, plus fully custom commerce where a platform would get in the way. The recommendation depends on your catalogue, your margins and who has to maintain it — not on which one is fashionable.",
  },
  {
    question: "Can you work with an existing internal team?",
    answer:
      "Yes. That can mean building a piece your team does not have capacity for, taking a specific service line, or working inside your existing repository and review process. Direct developer-to-developer communication tends to make this faster, not slower.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "A focused website is one to two weeks. A production web application is usually four to eight weeks. Anything larger gets broken into milestones so you see working software throughout rather than waiting for one delivery at the end.",
  },
  {
    question: "What happens after launch?",
    answer:
      "You get a clean handover and you own everything. Ongoing development and a maintenance plan are both available month to month if you want them, and cancellable if you stop wanting them. Neither is a condition of the build.",
  },
  {
    question: "How does Forgeline work with TechZQuad?",
    answer:
      "They are partner companies with complementary focus. Forgeline handles digital product and web engineering; TechZQuad covers broader business technology and IT — automation, CRM, infrastructure, support and training. When a project needs capability on both sides, you can reach it without going and finding a second supplier.",
  },
];
