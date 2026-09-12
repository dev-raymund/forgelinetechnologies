import { Section, SectionHeading } from "@/components/ui/section";
import { promises, promiseStatement } from "@/data/promise";

/**
 * The Forgeline Promise.
 *
 * An editorial list rather than five feature cards. Cards would flatten five
 * commitments into five equal boxes and make them read as marketing; set as a
 * numbered manifesto, with the claim carrying real typographic weight and the
 * detail beneath it, they read as terms — which is what they are.
 *
 * The numbering is correct here for the same reason it is correct on the
 * process: these are a defined set a reader works through, and the number is
 * how you refer back to one.
 */
export function Promise() {
  return (
    <Section id="promise" ground="white" size="peak" labelledBy="promise-title">
      <SectionHeading
        id="promise-title"
        title="The Forgeline Promise"
        dek="A method is only worth publishing if the people running it are held to something. These are the five commitments behind it — and every one is something we control, which is why none of them mentions rankings, traffic or revenue. Those depend on your market. These depend on us."
      />

      <ol className="flex flex-col">
        {promises.map((item, i) => (
          <li
            key={item.number}
            className={`grid gap-x-10 gap-y-4 border-t border-graphite/80 py-9 md:grid-cols-12 md:py-11 ${
              i === promises.length - 1 ? "border-b" : ""
            }`}
          >
            <div className="md:col-span-4">
              <span
                aria-hidden="true"
                className="mb-3 block h-0.5 w-6 bg-accent"
              />
              <span className="font-mono text-micro text-faint">
                {item.number}
              </span>
              <h3 className="mt-2.5 text-subtitle font-semibold text-graphite">
                {item.title}
              </h3>
            </div>

            <div className="md:col-span-8">
              <p className="max-w-[46ch] text-dek font-medium leading-snug text-graphite">
                {item.claim}
              </p>
              <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-subtitle font-semibold text-graphite md:mt-14">
        {promiseStatement}
      </p>
    </Section>
  );
}
