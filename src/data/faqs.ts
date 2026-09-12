/**
 * Buyer-focused FAQ.
 *
 * Ordered the way a buyer actually thinks: what do you do, who will do it,
 * what happens before we start, what does it cost, what if it changes, what do
 * I end up owning — then the specifics, then what happens after launch.
 *
 * Several of these exist to back the Promise with detail rather than repeat
 * it. The rest answer the questions the old FAQ avoided: price, ownership,
 * and who is actually writing the code.
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
      "Websites, web applications, e-commerce storefronts, custom software, and the APIs, integrations and automations that connect them — plus the technical SEO that makes them findable. If it runs in a browser and a business depends on it, it is in scope.",
  },
  {
    question: "Who actually builds my project?",
    answer:
      "Raymund Hermoso, the founder. You talk to the developer building it, not an account manager relaying messages to one. That is the whole point of the studio, and it is why the client list is deliberately not enormous.",
  },
  {
    question: "What happens before development begins?",
    answer:
      "A free call to work out what the project has to do, then a written scope: deliverables, milestones, who is responsible for what, and the assumptions behind the estimate. You approve that and the price before any code exists. Nothing starts on a verbal understanding.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Scope is agreed first and the price is fixed against it, so the number you approve is the number you pay. Starting figures are published rather than held back until you book a call. If a project cannot be scoped properly up front, we say so instead of quoting a number we would later have to move.",
  },
  {
    question: "What happens if the scope changes?",
    answer:
      "You hear about it when we do. The trade-off gets explained, and anything outside the agreed scope is priced and approved before it is built — you can always say no, and the original price is unaffected either way. A change never turns up unannounced on an invoice.",
  },
  {
    question: "Who owns the website and the code?",
    answer:
      "You do. Code, accounts and documentation all transfer on handover, under the terms agreed for the project. There is no proprietary page builder holding your content and no requirement to stay on a support plan to keep what you paid for.",
  },
  {
    question: "Will I be able to update the site myself?",
    answer:
      "Yes, for the content you should be able to change — text, images, pages, products, posts. That is a scoping decision made up front, because building an editable structure is different work from building a fixed one. Anything genuinely technical stays with a developer, which is normal and worth being honest about.",
  },
  {
    question: "Can you improve an existing website?",
    answer:
      "Yes, and it is common. Taking over an existing build, finishing one that was abandoned, moving between platforms, or making a slow site fast are all normal work. You do not have to start again to get help.",
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
    question: "Do you offer SEO?",
    answer:
      "Technical and on-page SEO: how pages are structured, labelled and linked, how fast they load, metadata, structured data, and clean migrations. It gives a site a stronger foundation for organic search. What it is not is a ranking guarantee — nobody can honestly offer one, because rankings depend on competitors and search engines nobody controls.",
  },
  {
    question: "Do you build automations?",
    answer:
      "Yes — form-to-CRM workflows, lead routing, notifications, scheduled jobs, data syncing between systems that do not talk to each other. The test is whether a task happens often, the same way each time, and gains nothing from a person doing it. Anything needing judgement stays with the person who has the judgement.",
  },
  {
    question: "Can you work with our existing internal team?",
    answer:
      "Yes. That can mean building a piece your team has no capacity for, taking a specific service line, or working inside your existing repository and review process. Developer-to-developer communication tends to make this faster, not slower.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "A focused website is one to two weeks. A production web application is usually four to eight weeks. Anything bigger gets split into milestones, so you see working software throughout rather than waiting on a single delivery at the end.",
  },
  {
    question: "Do you provide support after launch?",
    answer:
      "If you want it. Ongoing development and a maintenance plan are both available month to month and cancellable. Neither is a condition of the build — you get a clean handover regardless, and you are free to take the work anywhere.",
  },
];
