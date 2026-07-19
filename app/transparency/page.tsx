import { FEATURES, AGGREGATE_SOURCES, assertNoProfileJoin } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

assertNoProfileJoin();

export default function TransparencyPage() {
  return (
    <div>
      <h1>What we use &amp; why</h1>
      <p className="notice">
        Per the challenge rules, <strong>every feature and its purpose is published
        here</strong>. There are no hidden proxies: we do not infer protected traits
        and do not use demographic, behavioral, or landlord-revenue features to rank,
        score, or decide anything about you.
      </p>

      <h2>Features</h2>
      <ul className="plain">
        {FEATURES.map((f) => (
          <li key={f.name} className="card">
            <strong>{f.name}</strong>{" "}
            <span className="badge ok">proxy risk: {f.proxyRisk}</span>
            <p>{f.purpose}</p>
            <p className="notice">Data used: {f.dataUsed}</p>
            <p className="notice">Your control: {f.renterControl}</p>
          </li>
        ))}
      </ul>

      <h2>Aggregate context sources (kept separate from you)</h2>
      <p className="notice">
        The following area-level datasets are used only for optional, transparent
        context. They are <strong>never joined to your profile</strong> and never
        used to profile, score, or rank an applicant or property.
      </p>
      <ul className="plain">
        {AGGREGATE_SOURCES.map((s) => (
          <li key={s} className="card">{s}</li>
        ))}
      </ul>

      <h2>Data you can always control</h2>
      <ul className="plain">
        <li className="card">Export everything you have stored, at any time.</li>
        <li className="card">Hard-delete your session — all stored data is removed, not just flagged.</li>
        <li className="card">Correct or reject any extracted value before it is used.</li>
        <li className="card">We never train on your uploads and never auto-submit your packet.</li>
      </ul>
    </div>
  );
}
