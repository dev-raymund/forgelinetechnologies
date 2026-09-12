import Image from "next/image";
import { partners } from "@/data/partners";

/**
 * Partner logos.
 *
 * Greyscale at rest, full colour on hover. Partner marks arrive in whatever
 * colours their owners chose, and a row of them at full saturation pulls more
 * attention than the studio's own brand — desaturating holds the page together
 * without altering anyone's logo, since the real colours are one hover away.
 *
 * Every logo is a link, and the accessible name is the company plus what they
 * cover, so a screen-reader user gets the same information the visual grid
 * conveys: who these companies are and why they are here.
 *
 * Sized by height so square and horizontal marks sit on one optical line.
 */
export function PartnerGrid({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-8 gap-y-6 ${className}`}>
      {partners.map((partner) => (
        <li key={partner.name}>
          <a
            href={partner.url}
            rel="noopener noreferrer"
            target="_blank"
            className="group inline-flex items-center gap-3 rounded-sm"
          >
            <Image
              src={partner.logo}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-[7px] grayscale opacity-70 transition duration-300 group-hover:grayscale-0 group-hover:opacity-100"
            />
            <span className="text-[0.9375rem] font-medium text-graphite [.on-ink_&]:text-on-ink">
              {partner.name}
              <span className="sr-only"> — {partner.role}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
