import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/realdoor/app-shell";
import { PaperCard } from "@/components/realdoor/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Info, Map as MapIcon } from "lucide-react";
import { useRealDoor } from "@/lib/realdoor-store";
import { PROPERTIES } from "@/lib/realdoor-data";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — RealDoor" },
      {
        name: "description",
        content:
          "Browse an unranked list of Boston-area affordable properties. Availability is unknown; RealDoor does not rank or filter by eligibility.",
      },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const rd = useRealDoor();
  useEffect(() => { rd.visitStage("discover"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const zip = rd.municipalityFilter.trim().toLowerCase();
    const query = q.trim().toLowerCase();
    return PROPERTIES.filter((p) => {
      const matchesFilter =
        !zip ||
        p.zip.toLowerCase().includes(zip) ||
        p.municipality.toLowerCase().includes(zip);
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [q, rd.municipalityFilter]);

  return (
    <AppShell>
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Stage 1 · Discover
        </div>
        <h1 className="ink-title mt-1 text-3xl sm:text-4xl">Boston-area properties</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Unfiltered public property set. Unranked list — RealDoor does not order results by
          suitability, eligibility, or predicted match. Availability is unknown; contact each
          property directly.
        </p>
      </header>

      <PaperCard className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="q">Search by name or address</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" placeholder="e.g. Franklin Park" />
            </div>
          </div>
          <div>
            <Label htmlFor="zip">Municipality or ZIP (optional)</Label>
            <Input
              id="zip"
              value={rd.municipalityFilter}
              onChange={(e) => rd.setMunicipalityFilter(e.target.value)}
              className="mt-1"
              placeholder="e.g. Cambridge or 02139"
            />
          </div>
          <button
            type="button"
            disabled
            aria-disabled
            className="inline-flex h-10 items-center gap-2 rounded-md border border-dashed border-border bg-paper px-3 text-sm text-muted-foreground"
            title="Map view is coming; addresses in the list have medium precision."
          >
            <MapIcon className="h-4 w-4" aria-hidden />
            Map view (coming)
          </button>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          Locations shown have <span className="font-medium">medium precision</span>. Verify addresses with the property.
        </p>
      </PaperCard>

      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((p) => (
          <li key={p.id}>
            <PaperCard className="h-full p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="ink-title text-lg">{p.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {p.address} · {p.municipality} · {p.zip}
                  </div>
                </div>
                <Badge variant="outline" className="border-border">
                  Availability: unknown
                </Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Total units</dt>
                <dd>{p.totalUnits}</dd>
                <dt className="text-muted-foreground">Bedroom mix</dt>
                <dd>{p.bedroomMix}</dd>
                <dt className="text-muted-foreground">Source</dt>
                <dd>{p.source}</dd>
                <dt className="text-muted-foreground">Retrieved</dt>
                <dd>{p.retrievedOn}</dd>
              </dl>
              {p.dataQualityFlags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.dataQualityFlags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full bg-attention/15 px-2 py-0.5 text-[10px] font-medium text-foreground ring-1 ring-attention/50"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </PaperCard>
          </li>
        ))}
        {list.length === 0 && (
          <li className="col-span-full">
            <PaperCard className="p-6 text-center text-sm text-muted-foreground">
              No properties match this filter. Clear the ZIP/municipality to see all.
            </PaperCard>
          </li>
        )}
      </ul>
    </AppShell>
  );
}
