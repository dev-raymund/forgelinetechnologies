import Image from "next/image";
import { team } from "@/data/team";

/**
 * The three people, as a block inside the About story — not a section of its
 * own.
 *
 * That distinction is the whole design. A separate "Meet the team" section
 * would read as a company introducing its staff; sitting directly under the
 * story of why the studio exists, the same three people read as the answer to
 * the question that story raises — so who actually does this?
 *
 * Portraits are square, small, and desaturated. The three photographs were
 * taken in completely different settings, and on a page built from two
 * colours three full-colour backgrounds pull harder than anything else on it.
 * Greyscale unifies them without altering anyone.
 */
function Portrait({
  src,
  alt,
  zoom,
}: {
  src: string;
  alt: string;
  zoom?: number;
}) {
  return (
    <div className="relative aspect-square w-20 shrink-0 overflow-hidden border border-rule bg-white sm:w-24">
      {/* The transform sits on a wrapper, not on <Image>. next/image with
          `fill` writes its own inline style and discards a passed `style`
          prop — verified by reading the rendered element back. */}
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
          sizes="6rem"
          className="object-cover object-[center_20%] grayscale"
        />
      </div>
    </div>
  );
}

export function People() {
  return (
    <div className="mt-14 border-t border-graphite/80 pt-8 md:mt-16">
      <h3 className="text-subtitle font-semibold text-graphite">
        The people behind the project
      </h3>
      <p className="mt-2 max-w-[56ch] text-[0.9375rem] leading-relaxed text-muted">
        Small team, clear responsibility. You know who you are talking to, who
        is managing the project, and who is building it.
      </p>

      <ul className="mt-9 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <li key={member.name} className="flex gap-4">
            <Portrait
              src={member.photo}
              alt={member.photoAlt}
              zoom={member.zoom}
            />
            <div className="min-w-0">
              <p className="text-[1.0625rem] font-semibold leading-snug text-graphite">
                {member.name}
              </p>
              <p className="mt-1 font-mono text-micro text-faint">
                {member.role}
              </p>
              <p className="mt-2.5 text-[0.875rem] leading-relaxed text-muted">
                {member.summary}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
