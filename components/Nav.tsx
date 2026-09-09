"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/check", label: "Check a size chart" },
  { href: "/catalog", label: "Catalog" },
  { href: "/profile", label: "My measurements" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Fit <span className="text-accent">Preview</span>
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "font-medium text-ink" : "text-ink-secondary hover:text-ink"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
