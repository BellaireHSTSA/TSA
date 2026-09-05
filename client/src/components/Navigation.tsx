import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import tsaLogo from "@assets/TSA_logo_v3.jpeg";

type NavItem = { label: string; href: string };
type NavGroup = { label: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => "items" in e;

const NAV: NavEntry[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    items: [
      { label: "Officers", href: "/officers" },
      { label: "Meetings", href: "/meetings" },
    ],
  },
  {
    label: "Compete",
    items: [
      { label: "Competetive Events", href: "/events" },
      { label: "Champions", href: "/champions" },
    ],
  },
  {
    label: "Members",
    items: [
      { label: "Membership", href: "/membership" },
      { label: "Resources", href: "/resources" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
];

function DropdownMenu({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const isActive = group.items.some((i) => i.href === location);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary/80",
          isActive ? "bg-secondary text-primary font-semibold" : "text-muted-foreground hover:text-primary"
        )}
      >
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-1 z-50 min-w-[160px]">
          <div className="rounded-lg border bg-background shadow-lg py-1 overflow-hidden">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-4 py-2.5 text-sm transition-colors hover:bg-secondary/60 hover:text-primary",
                  location === item.href ? "text-primary font-semibold bg-secondary/40" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const allMobileLinks: NavItem[] = NAV.flatMap((e) =>
    isGroup(e) ? e.items : [e]
  );

  return (
    <nav className={cn("sticky top-0 z-50 w-full border-b transition-colors duration-300", scrolled ? "bg-background shadow-sm" : "bg-background/80 backdrop-blur-md")}>
      <div className="w-full px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src={tsaLogo} alt="BHS TSA Logo" className="h-12 w-12 object-contain" />
            <span className="font-serif text-base font-bold tracking-tight hidden sm:block">Bellaire HS Technology Student Association</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:gap-0.5">
            {NAV.map((entry) =>
              isGroup(entry) ? (
                <DropdownMenu key={entry.label} group={entry} />
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-secondary/80",
                    location === entry.href
                      ? "bg-secondary text-primary font-semibold"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {entry.label}
                </Link>
              )
            )}
            <Link href="/join">
              <Button variant="outline" size="sm" className="ml-2">
                Join Us
              </Button>
            </Link>
            <a href="mailto:s1873392@online.houstonisd.org">
              <Button variant="default" size="sm" className="ml-2 font-serif">
                Contact
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-primary"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="space-y-1 px-4 py-4">
            {allMobileLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                  location === item.href
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/join" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full mt-1">Join Us</Button>
            </Link>
            <a href="mailto:s1873392@online.houstonisd.org" className="block mt-1">
              <Button className="w-full">Contact Us</Button>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
