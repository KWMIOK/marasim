import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Marasim",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Authentication UI will connect to Supabase Auth in the next phase.
        </p>
      </div>
    </main>
  );
}
