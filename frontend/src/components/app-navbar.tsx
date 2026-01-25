"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

type NavLink = {
  path: string;
  label: string;
  badge?: string;
};

const navLinks: NavLink[] = [
  { path: "/", label: "Home" },
  { path: "/exercises", label: "Exercises" },
  { path: "/workout-plan", label: "Workout Plan" },
  { path: "/progress", label: "Session History" },
];

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen
          ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-lg font-semibold text-white">
              Gregor
            </span>
            <span className="hidden sm:inline-flex text-[0.6rem] uppercase tracking-[0.2em] text-gray-500">
              Recovery
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                  isActive(link.path)
                    ? "text-[#00ffcc] bg-[#00ffcc]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider bg-[#00ffcc] text-black rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden p-2 rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-1 border-t border-white/5 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-2 py-3 px-4 rounded-xl text-sm transition-colors ${
                  isActive(link.path)
                    ? "text-[#00ffcc] bg-[#00ffcc]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider bg-[#00ffcc] text-black rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
