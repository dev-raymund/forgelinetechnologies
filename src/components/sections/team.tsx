import Image from "next/image";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { team } from "@/data/team";

/**
 * The people on a project.
 *
 * Editorial, not a staff directory. Portraits share the hairline border the
 * founder photo already uses, at a deliberately smaller size — the names and
 * what they do carry the section, the pictures only confirm these are real
 * people.
 *
 * A square frame rather than the founder's 4:5, because both supplied
 * photographs are square: cropping them to a portrait ratio would discard part
 * of each image to satisfy a format neither was shot for. The anchor sits
 * slightly above centre so faces land consistently in both.
 *
 * Both portraits are desaturated. The two source photographs were taken in
 * completely different settings, and on a page built from two colours a pair
 * of full-colour backgrounds pulls harder than anything else on it. Greyscale
 * unifies them without altering either person.
 *
 * A missing file renders a framed monogram rather than a broken image, so the
 * section degrades into something deliberate instead of something wrong.
 */
function Portrait({
  src,
  alt,
  name,
  zoom,
}: {
  src: string;
  alt: string;
  name: string;
  zoom?: number;
}) {
  const initials = name
    .split(" ")
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="relative aspect-square w-24 overflow-hidden border border-rule bg-paper sm:w-28">
      {src ? (
        // The transform sits on a wrapper, not on <Image>. next/image with
        // `fill` writes its own inline style and discards a passed `style`
        // prop — verified by reading the rendered element, which came back
        // with transform: none.
        <div
          className="absolute inset-0"
          style={
            zoom
              ? { transform: `scale(${zoom})`, transformOrigin: "top center" }
              : undefined
          }
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="7rem"
            className="object-cover object-[center_20%] grayscale"
          />
        </div>
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center font-mono text-[1.25rem] text-faint"
        >
          {initials}
        </span>
      )}
    </div>
  );
}

/**
 * `compact` is the homepage treatment: names, roles and portraits, with the
 * detail left on About. The homepage should not become a staff directory, and
 * the argument it is supporting — you know who you are talking to — is made by
 * the faces and the two roles, not by the paragraphs.
 */
export function Team({
  compact = false,
  ground = "paper",
}: {
  compact?: boolean;
  /** Set per page so the section alternation holds wherever this is placed. */
  ground?: "paper" | "white";
}) {
  if (compact) {
    return (
      <Section ground={ground} size="md" labelledBy="team-strip-title">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h2
              id="team-strip-title"
              className="text-title max-w-[18ch] font-semibold text-graphite"
            >
              The people behind the build
            </h2>
            <p className="mt-5 max-w-[44ch] text-dek leading-relaxed text-muted">
              Small enough that you know who you are talking to, and who is
              doing the work.
            </p>
            <Link
              href="/about"
              className="mt-7 inline-block text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-accent"
            >
              More about the studio
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-10 gap-y-8 md:col-span-6 md:col-start-7 md:self-center">
            {team.map((member) => (
              <li key={member.name} className="flex items-center gap-4">
                <Portrait
                  src={member.photo}
                  alt={member.photoAlt}
                  name={member.name}
                  zoom={member.zoom}
                />
                <div>
                  <p className="text-[1.0625rem] font-semibold text-graphite">
                    {member.name}
                  </p>
                  <p className="mt-1 font-mono text-micro text-faint">
                    {member.role}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    );
  }

  return (
    <Section ground={ground} size="lg" labelledBy="team-title">
      <SectionHeading
        id="team-title"
        title="The people on a project"
        dek="A small team, which is the point. You know who you are talking to and who is doing the work — and the person answering a technical question is the person who will implement the answer."
      />

      <ul className="grid gap-x-12 gap-y-12 md:grid-cols-2">
        {team.map((member) => (
          <li key={member.name} className="border-t border-graphite/80 pt-7">
            <Portrait
              src={member.photo}
              alt={member.photoAlt}
              name={member.name}
              zoom={member.zoom}
            />
            <h3 className="mt-5 text-subtitle font-semibold text-graphite">
              {member.name}
            </h3>
            <p className="mt-1 font-mono text-micro text-faint">
              {member.role}
            </p>
            <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
              {member.summary}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-12 max-w-[62ch] text-dek leading-relaxed text-graphite">
        Have a project in mind?{" "}
        <Link
          href="/contact"
          className="font-medium underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-accent"
        >
          Start a project
        </Link>
        .
      </p>
    </Section>
  );
}
