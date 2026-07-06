import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SocialLogin } from "@/components/auth/social-login";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Sign in — Marasim",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link href={ROUTES.home} className="text-sm font-semibold text-rose-600">
          Marasim
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Choose how you&apos;d like to continue.
        </p>

        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-zinc-400">Loading…</p>}>
            <SocialLogin />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
