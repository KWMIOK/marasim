"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEvent,
  importGuestsForEvent,
} from "@/lib/actions/events";
import { defaultContentSlots } from "@/lib/events/defaults";
import { parseGuestFile } from "@/lib/guests/parse-roster";
import { slugify } from "@/lib/utils/urls";
import { ContentSlotsEditor } from "@/components/admin/content-slots-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ContentSlot, Profile, TemplateType } from "@/types/database";

type HostOption = Pick<Profile, "id" | "full_name" | "role">;

export function EventForm({
  hosts,
  currentUserId,
}: {
  hosts: HostOption[];
  currentUserId: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [templateType, setTemplateType] = useState<TemplateType>("standard");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [hostId, setHostId] = useState(currentUserId);
  const [eventDate, setEventDate] = useState("");
  const [locationName, setLocationName] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [countdownTarget, setCountdownTarget] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1a1a2e");
  const [secondaryColor, setSecondaryColor] = useState("#e94560");
  const [contentSlots, setContentSlots] = useState<ContentSlot[]>(
    defaultContentSlots("standard")
  );
  const [guestFile, setGuestFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const autoSlug = useMemo(() => slugify(title), [title]);

  function handleTemplateChange(value: TemplateType) {
    setTemplateType(value);
    setContentSlots(defaultContentSlots(value));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!title.trim()) {
      setError("Event title is required.");
      setLoading(false);
      return;
    }

    const result = await createEvent({
      title: title.trim(),
      slug: slug.trim() || autoSlug,
      template_type: templateType,
      status,
      host_id: hostId,
      event_date: eventDate || undefined,
      location_name: locationName,
      maps_url: mapsUrl,
      countdown_target: countdownTarget || eventDate || undefined,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      content_slots: contentSlots,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (guestFile) {
      try {
        const buffer = await guestFile.arrayBuffer();
        const guests = parseGuestFile(buffer, guestFile.name);
        const importResult = await importGuestsForEvent(result.eventId, guests);

        if (!importResult.success) {
          setError(`Event created, but guest import failed: ${importResult.error}`);
          setLoading(false);
          router.push(`/admin/events/${result.eventId}`);
          return;
        }
      } catch (importError) {
        const message =
          importError instanceof Error ? importError.message : "Guest import failed.";
        setError(`Event created, but guest import failed: ${message}`);
        setLoading(false);
        router.push(`/admin/events/${result.eventId}`);
        return;
      }
    }

    router.push(`/admin/events/${result.eventId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Basic details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Event title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ahmed & Sara Wedding"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">URL slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={autoSlug || "ahmed-sara-wedding"}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Invitation URL: /e/{slug.trim() || autoSlug || "your-slug"}/[guest-token]
            </p>
          </div>
          <div>
            <Label htmlFor="host">Host / client</Label>
            <Select
              id="host"
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
              className="mt-1"
            >
              {hosts.map((host) => (
                <option key={host.id} value={host.id}>
                  {host.full_name ?? host.id} ({host.role})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="template">Template type</Label>
            <Select
              id="template"
              value={templateType}
              onChange={(e) => handleTemplateChange(e.target.value as TemplateType)}
              className="mt-1"
            >
              <option value="standard">Standard</option>
              <option value="vip">VIP</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="mt-1"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="eventDate">Event date & time</Label>
            <Input
              id="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="countdown">Countdown target</Label>
            <Input
              id="countdown"
              type="datetime-local"
              value={countdownTarget}
              onChange={(e) => setCountdownTarget(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="location">Location name</Label>
            <Input
              id="location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Four Seasons Hotel Kuwait"
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="maps">Google Maps URL</Label>
            <Input
              id="maps"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="mt-1"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Brand colors</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="primary">Primary color</Label>
            <div className="mt-1 flex gap-2">
              <input
                id="primary"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-zinc-300"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="secondary">Secondary color</Label>
            <div className="mt-1 flex gap-2">
              <input
                id="secondary"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-zinc-300"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Content blocks</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Dynamic invitation content — no code changes needed per event.
        </p>
        <div className="mt-4">
          <ContentSlotsEditor slots={contentSlots} onChange={setContentSlots} />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Guest list import</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Upload CSV or Excel with columns: <code className="text-xs">name</code>,{" "}
          <code className="text-xs">phone_number</code>, optional{" "}
          <code className="text-xs">is_vip</code>,{" "}
          <code className="text-xs">table_number</code>,{" "}
          <code className="text-xs">companion_count</code>.
        </p>
        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="mt-4"
          onChange={(e) => setGuestFile(e.target.files?.[0] ?? null)}
        />
        {guestFile ? (
          <p className="mt-2 text-sm text-zinc-600">Selected: {guestFile.name}</p>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create event"}
        </button>
      </div>
    </form>
  );
}
