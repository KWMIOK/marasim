"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export function LoginContent() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col justify-end px-6 pb-6 pt-16">
      <div className="mx-auto w-full">
        <Suspense fallback={<p className="text-center text-sm text-gold-muted">…</p>}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
