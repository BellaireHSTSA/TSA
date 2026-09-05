import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  backgroundImage?: string;
}

export function PageHeader({ title, description, className, backgroundImage }: PageHeaderProps) {
  if (backgroundImage) {
    return (
      <div className="relative overflow-hidden rounded-b-3xl shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundImage}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className={cn(
          "relative z-10 w-full px-4 py-24 sm:px-6 text-center",
          className
        )}>
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-white drop-shadow-lg">
            {title}
          </h1>

          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white font-medium leading-relaxed drop-shadow-md">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-secondary/30 py-16 sm:py-24", className)}>
      <div className="w-full px-4 text-center sm:px-6">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
