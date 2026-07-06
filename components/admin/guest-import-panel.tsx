"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importGuestsForEvent } from "@/lib/actions/events";
import { parseGuestFile } from "@/lib/guests/parse-roster";
import { Input } from "@/components/ui/input";

export function GuestImportPanel({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleImport() {
    if (!file) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const guests = parseGuestFile(buffer, file.name);
      const result = await importGuestsForEvent(eventId, guests);

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(`Imported ${result.imported} guests.`);
        setFile(null);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Import guests</h2>
      <p className="mt-1 text-sm text-zinc-500">
        CSV or Excel with name, phone_number, is_vip, table_number, companion_count.
      </p>
      <Input
        type="file"
        accept=".csv,.xlsx,.xls"
        className="mt-4"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-2 text-sm text-green-600">{success}</p> : null}
      <button
        type="button"
        onClick={handleImport}
        disabled={!file || loading}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Importing…" : "Import file"}
      </button>
    </div>
  );
}
