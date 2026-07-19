"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/discover", label: "Discover" },
  { href: "/profile", label: "Profile" },
  { href: "/understand", label: "Understand" },
  { href: "/prepare", label: "Prepare" },
  { href: "/session", label: "Session" },
  { href: "/transparency", label: "Transparency" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
