import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Cta from "@/components/sections/cta";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedWorks, getWorkBySlug } from "@/lib/queries";

export const revalidate = 3600;

const CATEGORY_LABEL: Record<string, string> = {
  apps: "Web application",
  ecommerce: "E-commerce",
  sites: "Website",
};

export async function generateStaticParams() {
  const works = await getPublishedWorks();
  return works.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) return { title: "Project not found" };

  return {
    title: work.title,
    description: work.description || `${work.title} — a Forgeline Technologies project.`,
    alternates: { canonical: `/work/${work.slug}` },
    openGraph: {
      title: work.title,
      description: work.description,
      images: work.imageUrl ? [{ url: work.imageUrl }] : undefined,
    },
  };
}

/**
 * The works table holds title, badge, description, image and live URL — and
 * that is genuinely all we know. Rather than padding the page with invented
 * "challenge / solution / result" copy, it presents those fields well and
 * leaves room for a real case study to be added later.
 */
export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) notFound();

  const all = await getPublishedWorks();
  const more = all.filter((w) => w.slug !== work.slug).slice(0, 3);

  return (
    <>
      <section className="on-dark bg-ink-950 pt-32 pb-16 text-white/65 lg:pt-40">
        <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All work
          </Link>
          <p className="eyebrow mt-8">
            {work.badge || CATEGORY_LABEL[work.category] || work.category}
          </p>
          <h1 className="mt-5 max-w-[18ch] text-h1 font-semibold text-white">{work.title}</h1>
          {work.description ? (
            <p className="mt-6 max-w-[56ch] text-[1.05rem] leading-relaxed">
              {work.description}
            </p>
          ) : null}
          {work.liveUrl ? (
            <ButtonLink href={work.liveUrl} variant="ghost-dark" className="mt-8">
              Visit live site
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          ) : null}
        </div>
      </section>

      {work.imageUrl ? (
        <section className="bg-paper">
          <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
            <div className="relative -mt-10 aspect-[16/10] overflow-hidden rounded-[3px] border border-line bg-paper-100 shadow-[0_20px_60px_-30px_rgba(5,8,15,0.45)]">
              <Image
                src={work.imageUrl}
                alt={work.imageAlt || `${work.title} — project screenshot`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 76rem"
                className="object-cover object-top"
              />
            </div>
          </div>
        </section>
      ) : null}

      {more.length > 0 && (
        <section className="bg-paper py-section">
          <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
            <p className="eyebrow">More work</p>
            <ul className="mt-10 grid gap-8 md:grid-cols-3">
              {more.map((w) => (
                <li key={w.id}>
                  <Link href={`/work/${w.slug}`} className="group block">
                    <div className="relative aspect-[16/11] overflow-hidden rounded-[3px] border border-line bg-paper-100">
                      {w.imageUrl ? (
                        <Image
                          src={w.imageUrl}
                          alt={w.imageAlt || `${w.title} — project screenshot`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                    <h2 className="mt-4 text-h3 font-semibold transition-colors group-hover:text-brand-600">
                      {w.title}
                    </h2>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Cta />
    </>
  );
}
