import { DEMO_CONFIG } from "@/data/config";
import { loadSynthetic } from "@/lib/corpus/loader";

export default function Home() {
  const docs = loadSynthetic();
  return (
    <div>
      <h1>RealDoor — Application-Readiness Copilot</h1>
      <p className="notice">
        This is an <strong>assistive, renter-side</strong> copilot for{" "}
        <strong>{DEMO_CONFIG.program}</strong> in the <strong>{DEMO_CONFIG.metro}</strong>{" "}
        for rule year <strong>{DEMO_CONFIG.ruleYear}</strong>. It extracts, explains,
        calculates, and prepares. <strong>It never decides eligibility.</strong> A
        qualified human at the property makes that decision.
      </p>

      <h2>The three journeys</h2>
      <ul className="plain">
        <li>
          <strong>Profile</strong> — upload a synthetic document; we extract only
          allowlisted fields with source boxes; you confirm or correct each one.
        </li>
        <li>
          <strong>Understand</strong> — see the published rule with citations and the
          deterministic income-to-limit math from your confirmed inputs.
        </li>
        <li>
          <strong>Prepare</strong> — compare your profile to the document checklist,
          flag gaps, and build a renter-controlled packet you can download and delete.
        </li>
      </ul>

      <h2>Try a synthetic document</h2>
      <p>These are synthetic demo documents (no real personal data).</p>
      <ul className="plain">
        {docs.map((d) => (
          <li key={d.id}>
            <code>{d.id}</code> — {d.type}{" "}
            <a href={`/profile?doc=${d.id}`}>open in Profile</a>
          </li>
        ))}
      </ul>

      <p className="row" style={{ marginTop: "1.5rem" }}>
        <a className="btn" href="/profile">Start: Profile</a>
        <a className="btn secondary" href="/transparency">What we use &amp; why</a>
      </p>
    </div>
  );
}
