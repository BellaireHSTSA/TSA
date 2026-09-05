import { PageHeader } from "@/components/PageHeader";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import officers from "@/data/officers.json";
import type { Officer } from "@shared/schema";

function resolveUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("attached_assets/")) {
    return "/media/" + url.replace("attached_assets/", "").split("/").map(encodeURIComponent).join("/");
  }
  return url;
}

const SCHOOL_YEAR = "2026-2027";
const officerRows = officers as Officer[];

export default function Officers() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Our Leadership"
        description={`Meet the dedicated officers serving the ${SCHOOL_YEAR} school year.`}
        backgroundImage="https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&h=900&fit=crop"
      />

      <div className="w-full -mt-16 relative px-4 sm:px-6 z-20">
        <div className="flex flex-wrap justify-center gap-8">
          {officerRows.map((officer, index) => (
            <motion.div
              key={officer.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]"
            >
              <Card className="overflow-hidden border-none shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl">
                <div className="h-32 bg-gradient-to-r from-primary to-primary/80" />
                <CardContent className="relative pt-0 px-6 pb-8 text-center">
                  <div className="mx-auto -mt-16 mb-4 flex justify-center">
                    <Avatar className="h-32 w-32 border-4 border-card shadow-md">
                      <AvatarImage src={resolveUrl(officer.imageUrl)} alt={officer.name} className="object-cover" />
                      <AvatarFallback className="text-3xl font-serif bg-secondary text-primary">
                        {officer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <h3 className="mb-1 font-serif text-2xl font-bold text-foreground">
                    {officer.name}
                  </h3>
                  <div className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                    {officer.role}
                  </div>

                  {officer.description && (
                    <p className="mb-6 text-sm text-muted-foreground">
                      {officer.description}
                    </p>
                  )}

                  {officer.email && (
                    <div className="flex justify-center">
                      <a
                        href={`mailto:${officer.email}`}
                        className="rounded-full bg-secondary p-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        title={`Email ${officer.name}`}
                        data-testid={`link-email-${officer.id}`}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
