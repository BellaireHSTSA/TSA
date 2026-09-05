import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { Champion } from "@shared/schema";
import champions from "@/data/champions.json";

const LEVEL_COLORS: Record<string, string> = {
  Regionals: "bg-blue-100 text-blue-800",
  State: "bg-purple-100 text-purple-800",
  Nationals: "bg-amber-100 text-amber-800",
};

const PLACEMENT_ICONS: Record<string, string> = {
  "1st Place": "🥇", "1": "🥇",
  "2nd Place": "🥈", "2": "🥈",
  "3rd Place": "🥉", "3": "🥉",
};

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes("youtube.com") || url.includes("youtu.be");
}

function resolveMediaUrl(url: string) {
  if (url.startsWith("attached_assets/")) {
    const filename = url.replace("attached_assets/", "");
    return "/media/" + filename.split("/").map(encodeURIComponent).join("/");
  }
  return url;
}

function MediaEmbed({ url }: { url: string }) {
  const src = resolveMediaUrl(url);
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    const id = src.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    return (
      <iframe
        className="w-full aspect-video rounded-lg mt-3"
        src={`https://www.youtube.com/embed/${id}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (isVideo(src)) {
    return <video src={src} controls className="w-full rounded-lg mt-3 max-h-48 object-cover" />;
  }
  return <img src={src} alt="Achievement media" className="w-full rounded-lg mt-3 max-h-48 object-cover" />;
}


const championRows = champions as Champion[];

export default function Champions() {
  const grouped = championRows.reduce((acc, c) => {
    if (!acc[c.year]) acc[c.year] = [];
    acc[c.year].push(c);
    return acc;
  }, {} as Record<string, Champion[]>);

  const sortedYears = Object.keys(grouped ?? {}).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Hall of Champions"
        description="Celebrating our members' achievements in TSA competitions."
      />

      <div className="w-full mt-12 px-4 sm:px-6">
        {sortedYears.length === 0 ? (
          <div className="text-center py-24 bg-secondary/20 rounded-xl border border-dashed">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground opacity-40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No champions yet</h3>
            <p className="text-muted-foreground">Check back after competitions!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedYears.map(year => (
              <motion.section
                key={year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-serif text-2xl font-bold text-foreground">{year}</h2>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped![year].map((champion, index) => (
                    <motion.div
                      key={champion.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="mb-3 text-2xl">
                        {PLACEMENT_ICONS[champion.placement] ?? "🏅"}
                      </div>

                      <p className="font-serif text-lg font-bold text-foreground mb-1">{champion.memberName}</p>
                      <p className="text-sm text-muted-foreground mb-3">{champion.eventTitle}</p>

                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {champion.placement}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[champion.level] ?? "bg-secondary text-secondary-foreground"}`}>
                          {champion.level}
                        </span>
                      </div>

                      {champion.notes && (
                        <p className="mt-3 text-xs text-muted-foreground italic">{champion.notes}</p>
                      )}

                      {champion.mediaUrl && (
                        <MediaEmbed url={champion.mediaUrl} />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
