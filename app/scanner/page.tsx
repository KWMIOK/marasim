import { PageShell } from "@/components/shared/page-shell";

export default function ScannerPage() {
  return (
    <PageShell className="max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900">QR Check-In</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Camera scanner and manual token fallback will use html5-qrcode and the
        check_in_guest RPC.
      </p>
      <div className="mt-8 aspect-square rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-100" />
    </PageShell>
  );
}
