import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getSessionUser()) redirect("/admin");

  /* Only same-origin paths are honoured. Reflecting an arbitrary `next` into a
     redirect is an open redirect, and a login page is exactly where one gets
     used. */
  const target = next && /^\/admin(\/|$)/.test(next) ? next : "/admin";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-16">
      <div className="w-full max-w-[26rem]">
        <p className="font-mono text-micro text-accent">Forgeline</p>
        <h1 className="mt-3 text-title font-semibold text-white">Admin sign in</h1>
        <p className="mt-3 text-[0.9375rem] text-on-ink-muted">
          This area is for Forgeline staff. Everything here is private.
        </p>
        <div className="mt-8 rounded-sm bg-white p-6">
          <LoginForm next={target} />
        </div>
      </div>
    </div>
  );
}
