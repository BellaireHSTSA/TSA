import { Link } from "wouter";
import tsaLogo from "@assets/TSA_logo_v3.jpeg";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="w-full px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src={tsaLogo} alt="BHS TSA Logo" className="h-12 w-12 object-contain" />
              <span className="font-serif text-lg font-bold tracking-tight">Technology Student Association</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
              Empowering students to lead in a technical world. Join us to innovate, create, and compete.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Explore</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/membership" className="text-sm text-muted-foreground hover:text-primary transition-colors">Membership</Link></li>
              <li><Link href="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors">Events</Link></li>
              <li><Link href="/champions" className="text-sm text-muted-foreground hover:text-primary transition-colors">Champions</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Chapter</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/officers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Officers</Link></li>
              <li><Link href="/meetings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Meetings</Link></li>
              <li><Link href="/resources" className="text-sm text-muted-foreground hover:text-primary transition-colors">Resources</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Help</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/faqs" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BHS TSA Chapter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
