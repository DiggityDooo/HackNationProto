import { DEMO_CONFIG } from "@/data/config";
import { loadLihtcBoston } from "@/lib/corpus/loader";

export default function DiscoverPage() {
  const projects = loadLihtcBoston();
  return (
    <div>
      <h1>Discover — public LIHTC inventory</h1>
      <p className="notice">
        <span className="badge info">Boston pilot</span> Frozen public list for{" "}
        <strong>{DEMO_CONFIG.metro}</strong> ({projects.length} projects). These are published
        project records — not open units, waitlists, or rents. Every card shows{" "}
        <strong>Availability: unknown</strong>. RealDoor does not rank or recommend.
      </p>
      <p className="notice">You confirm. A qualified human decides.</p>
      <ul className="plain">
        {projects.map((p) => (
          <li key={p.hud_id} className="card" style={{ marginBottom: "0.75rem" }}>
            <strong>{p.name}</strong>
            <div>
              {p.address}, {p.city}, {p.state} {p.zip}
            </div>
            <div className="notice">
              Units (total / low-income): {String(p.total_units)} / {String(p.li_units)} ·{" "}
              <span className="badge info">Availability: unknown</span>
            </div>
            <div className="evidence">{p.source}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
