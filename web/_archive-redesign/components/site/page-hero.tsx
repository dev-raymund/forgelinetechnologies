import GridMotif from "@/components/ui/grid-motif";
/**
 * Every page opens on an ink band. That consistency is what lets the nav
 * start transparent-on-dark and flip to paper on scroll without each page
 * having to tell it which treatment to use.
 */
export default function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-ink-950 pt-32 pb-16 text-white/65 lg:pt-40 lg:pb-20">
      <GridMotif />
      <div className="relative mx-auto max-w-[76rem] px-6 lg:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-6 max-w-[18ch] text-h1 font-semibold text-white">{title}</h1>
        {lede ? (
          <p className="mt-6 max-w-[54ch] text-[1.05rem] leading-relaxed">{lede}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
