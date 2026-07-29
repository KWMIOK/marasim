"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AppPageShell } from "@/components/shared/app-page-shell";

export function LoginContent() {
  return (
    <AppPageShell align="end" className="pt-16">
      <Suspense fallback={<p className="text-center text-sm text-gold-muted">…</p>}>
        <AuthForm />
      </Suspense>
    </AppPageShell>
  );
}
