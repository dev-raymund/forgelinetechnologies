import { founder } from "@/lib/site";

/**
 * The three people on a project, in the order a client meets them.
 *
 * They live in one list rather than a founder plus a separate team, because
 * the point being made is structural: you know who you talk to, who manages
 * the work, and who builds it. Splitting that across two sections would say
 * the opposite — that there is a leadership tier and then some staff.
 *
 * Nothing here is invented. Names and roles exactly as supplied; no years of
 * experience, no employers, no qualifications, no technology lists. Raymund's
 * name, role and photograph come from site.ts so there is one source for them
 * and the structured data cannot drift from the page.
 */
export type TeamMember = {
  name: string;
  role: string;
  /** One line: what they are responsible for, in the client's terms. */
  summary: string;
  photo: string;
  photoAlt: string;
  /**
   * Optional crop zoom, applied from the top of the frame.
   *
   * The three photographs are framed very differently — a wider shot, a
   * head-and-shoulders portrait, a half-length one — so at an identical crop
   * the faces render at wildly different sizes and stop reading as one set.
   * This adjusts framing only; nothing about any person is altered.
   *
   * A number rather than a Tailwind class deliberately: Tailwind cannot
   * generate a class from a runtime string, so `scale-[${zoom}]` would
   * silently produce no CSS at all.
   */
  zoom?: number;
};

export const team: TeamMember[] = [
  {
    name: founder.name,
    role: founder.role,
    summary:
      "Started the studio and leads its technical direction. The reason it works the way it does is in the story above.",
    photo: founder.photo,
    photoAlt: `${founder.name} — ${founder.role}`,
    zoom: 1.15,
  },
  {
    name: "Romeo D. Lobaton Jr.",
    role: "Project Manager",
    summary:
      "Your point of contact. Coordinates conversations, meetings and progress, and keeps requirements moving from a discussion into the build.",
    photo: "/assets/team/RomeoLobaton.webp",
    photoAlt: "Romeo D. Lobaton Jr. — Project Manager",
    zoom: 1.55,
  },
  {
    name: "Mark C. Balinario",
    role: "Web Developer",
    summary:
      "Builds the web work — implementing the agreed requirements, and maintaining what ships once it is live.",
    photo: "/assets/team/MarkBalinario.webp",
    photoAlt: "Mark C. Balinario — Web Developer",
  },
];
