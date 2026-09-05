import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface ResourceCardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
}

export function ResourceCard({ title, description, href, icon }: ResourceCardProps) {
  const isExternal = href.startsWith('http');
  const Component = isExternal ? 'a' : Link;
  const props = isExternal ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };

  return (
    // @ts-ignore - Wouter Link vs Anchor type mismatch is handled safely by browser
    <Component 
      {...props}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1"
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-secondary opacity-50 transition-all group-hover:bg-accent group-hover:scale-150" />
      
      <div className="relative z-10">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
        <h3 className="mb-2 font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="relative z-10 mt-6 flex items-center text-sm font-semibold text-primary">
        <span>Explore</span>
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Component>
  );
}
