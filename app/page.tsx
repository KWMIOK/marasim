import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Marasim — Digital Invitations",
  description: "Reusable multi-tenant digital invitation platform",
};

export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-6 py-24">
      <div className="max-w-xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-rose-500">
          Marasim
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
          Digital Invitation Platform
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          Create dynamic event invitations, manage guest lists, track RSVPs, and
          run QR check-in — all without touching the codebase.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.login}
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Sign in
          </Link>
          <Link
            href={ROUTES.admin.root}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </main>
  );
}
