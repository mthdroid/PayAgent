"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Trade" },
    { href: "/flow", label: "Flow" },
    { href: "/receipts", label: "Receipts" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-[1280px] mx-auto px-4 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 mr-2">
            <Image
              src="/loggggq-removebg-preview.png"
              alt="PayAgent"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-[18px] font-semibold text-white">
              PayAgent
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-xl text-[15px] font-medium transition-colors ${
                  pathname === link.href
                    ? "text-white"
                    : "text-[#9b9b9b] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Network + Wallet */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[#9b9b9b] text-[13px]">SKALE</span>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            0x742d...bD18
          </button>
        </div>
      </div>
    </nav>
  );
}
