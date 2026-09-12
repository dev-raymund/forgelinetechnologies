/**
 * The people on a project.
 *
 * A careful piece of positioning. The entire site argues that fewer layers
 * between client and developer produce better work — so a client-facing role
 * has to be introduced as the thing that makes the conversation happen, not as
 * a layer standing in front of it. Romeo coordinates; he does not relay
 * technical decisions on someone else's behalf. That distinction is the whole
 * reason this section can exist without undermining the page above it.
 *
 * Nothing here is invented. Names and roles are exactly as supplied — no
 * years of experience, no previous employers, no technology lists, no
 * qualifications. Anything beyond a name and a role would be fiction.
 */
export type TeamMember = {
  name: string;
  role: string;
  /** One line: what they do and what it means for the client. */
  summary: string;
  /** Path under /public. Both sources are square; empty renders a framed
   *  monogram instead of a broken image. */
  photo: string;
  photoAlt: string;
  /**
   * Optional crop zoom, applied from the top of the frame.
   *
   * The two supplied photographs are framed very differently — one is a wider
   * shot, the other head-and-shoulders — so at an identical crop one face
   * renders roughly half the size of the other and they stop reading as the
   * same set. This is ordinary photo cropping expressed as data, not a
   * per-person hack, and it alters framing only. Nothing about either person
   * is changed.
   *
   * A number rather than a Tailwind class on purpose: Tailwind cannot generate
   * a class from a runtime string, so `scale-[${zoom}]` would silently produce
   * no CSS at all.
   */
  zoom?: number;
};

export const team: TeamMember[] = [
  {
    name: "Romeo D. Lobaton Jr.",
    role: "Client & Project Communications",
    summary:
      "The point of contact for project conversations — first enquiry, meetings, and the day-to-day communication while work is underway. He makes sure the conversation happens and stays clear; the technical answers still come from the person writing the code.",
    photo: "/assets/team/RomeoLobaton.webp",
    photoAlt: "Romeo D. Lobaton Jr. — Client & Project Communications",
    zoom: 1.55,
  },
  {
    name: "Mark C. Balinario",
    role: "Web Developer",
    summary:
      "Builds the web work — turning an agreed scope into something that runs in production, and keeping it maintainable once it is there.",
    photo: "/assets/team/MarkBalinario.webp",
    photoAlt: "Mark C. Balinario — Web Developer",
  },
];
