import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealDoor — Application-Readiness Copilot",
  description:
    "Assistive, renter-side copilot for LIHTC application readiness. Never decides eligibility.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header className="site-header">
          <div className="wrap">
            <span className="brand">RealDoor</span>
            <span className="brand-sub">Application-Readiness Copilot · assistive only</span>
            <nav aria-label="Primary">
              <a href="/profile">Profile</a>
              <a href="/understand">Understand</a>
              <a href="/prepare">Prepare</a>
              <a href="/transparency">Transparency</a>
            </nav>
          </div>
        </header>
        <main id="main" className="wrap">
          {children}
        </main>
        <footer className="site-footer wrap">
          <p>
            RealDoor explains published rules and prepared documents. A qualified human
            decides eligibility — this tool never does.
          </p>
        </footer>
      </body>
    </html>
  );
}
