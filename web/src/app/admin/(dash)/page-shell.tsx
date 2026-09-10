import Link from "next/link";

/** Sticky topbar + padded content area. Every admin screen uses this. */
export default function PageShell({
  title,
  crumb,
  actions,
  children,
}: {
  title: string;
  /** Optional "parent / current" trail shown after the title. */
  crumb?: { href: string; label: string };
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="adm-topbar">
        {crumb ? (
          <span className="adm-crumb">
            <Link href={crumb.href}>{crumb.label}</Link> / <b>{title}</b>
          </span>
        ) : (
          <h1>{title}</h1>
        )}
        <span className="spacer" />
        {actions}
      </header>
      <div className="adm-content">{children}</div>
    </>
  );
}
