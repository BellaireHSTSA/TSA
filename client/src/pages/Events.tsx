import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";

import {
  ExternalLink,
  FileText,
  Search,
  Users,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Event } from "@shared/schema";
import events from "@/data/events.json";

const DASH = " - ";
const DOT = " • ";

type CategoryFilter = "all" | "UTE" | "NQE";
type DifficultyFilter =
  | "all"
  | "Demanding"
  | "Hard"
  | "Medium";
type TeamSizeFilter = "all" | "individual" | "pair" | "small" | "large";



const TEAM_SIZE_OPTIONS: { label: string; value: TeamSizeFilter; description: string }[] = [
  { label: "All", value: "all", description: "Show all events" },
  { label: "Solo", value: "individual", description: "1 member per team" },
  { label: "Pair", value: "pair", description: "2 members per team" },
  { label: "Small Team", value: "small", description: "3–4 members per team" },
  { label: "Large Team", value: "large", description: "5+ members per team" },
];

function matchesTeamSize(event: Event, filter: TeamSizeFilter): boolean {
  if (filter === "all") return true;
  const min = event.teamSizeMin;
  const max = event.teamSizeMax;
  const effective = min ?? max;
  if (effective == null) return true;
  if (filter === "individual") return effective === 1;
  if (filter === "pair") return (min ?? 0) <= 2 && (max ?? effective) >= 2 && effective <= 2;
  if (filter === "small") return (min ?? 0) <= 4 && (max ?? effective) >= 3;
  if (filter === "large") return (max ?? effective) >= 5 || (min != null && min >= 5);
  return true;
}

const eventRows = events as Event[];

export default function Events() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [teamFilter, setTeamFilter] = useState<TeamSizeFilter>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");
  
  const filtered = eventRows.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || event.category === categoryFilter;
    const matchesDifficulty =
      difficultyFilter === "all" || event.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty && matchesTeamSize(event, teamFilter);
  });

  const hasActiveFilter = search !== "" || teamFilter !== "all" || categoryFilter !== "all" || difficultyFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setTeamFilter("all");
    setDifficultyFilter("all");
  }

  function formatTeams(min: number | null, max: number | null): string {
    if (min == null && max == null) return "1+ teams";
    if (min != null && max == null) return `${min}+ teams`;
    if (min != null && max != null && min !== max) return `${min}${DASH}${max} teams`;
    const val = min ?? max!;
    return `${val} team${val !== 1 ? "s" : ""}`;
  }

  function formatTeamSize(min: number | null, max: number | null): string {
    if (min == null && max == null) return "1+ per team";
    if (min != null && max == null) return `${min}+ per team`;
    if (min != null && max != null && min !== max) return `${min}${DASH}${max} per team`;
    return `${min ?? max} per team`;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Competitive Events"
        description="Explore TSA competitive events, study resources, and preparation guides."
      />

      <div className="w-full mt-12 px-4 sm:px-6">
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-event-search"
              type="text"
              placeholder="Search events by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              Category
            </span>
            {(["all", "UTE", "NQE"] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                data-testid={`filter-category-${cat}`}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 text-secondary-foreground border-transparent hover:border-primary/30 hover:bg-secondary"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
          {/* Difficulty filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              Difficulty
            </span>

            {(["all", "Medium", "Hard", "Demanding"] as DifficultyFilter[]).map(
              (difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setDifficultyFilter(difficulty)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                    difficultyFilter === difficulty
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 text-secondary-foreground border-transparent hover:border-primary/30 hover:bg-secondary"
                  }`}
                >
                  {difficulty === "all" ? "All" : difficulty}
                </button>
              )
            )}
          </div>
          {/* Team size filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mr-1">
              <Users className="h-3 w-3" /> Team size
            </span>
            {TEAM_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                data-testid={`filter-teamsize-${opt.value}`}
                onClick={() => setTeamFilter(opt.value)}
                title={opt.description}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                  teamFilter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 text-secondary-foreground border-transparent hover:border-primary/30 hover:bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}

            {hasActiveFilter && (
              <button
                data-testid="button-clear-filters"
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Result count */}
          {(
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered?.length ?? 0}</span> of{" "}
              <span className="font-medium text-foreground">{eventRows.length}</span> events
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered?.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05 }}
                className="group flex flex-col rounded-2xl bg-card border shadow-sm transition-all hover:shadow-md"
              >
                <div className="p-6 sm:p-8 flex flex-col h-full">
                  <div className="grid grid-cols-3 items-start mb-4">

                      <div>
                          <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary"
                          >
                              {event.category || "NQE"}
                          </Badge>
                      </div>

                      <div className="flex justify-center">
                          <Badge
                              className="bg-red-600 text-white"
                          >
                              {event.difficulty}
                          </Badge>
                      </div>

                      <div className="flex justify-end">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-full px-3 py-1 border">
                              <Users className="h-3 w-3" />
                              <span>
                                  {formatTeams(event.numTeamsMin, event.numTeamsMax)}
                                  {DOT}
                                  {formatTeamSize(event.teamSizeMin, event.teamSizeMax)}
                              </span>
                          </div>
                      </div>

                  </div>

                  <h3 className="mb-3 font-serif text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                    {event.description}
                  </p>

                  {event.guidelinesUrl ? (
                    <a
                      href={event.guidelinesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto block"
                    >
                      <Button
                        variant="outline"
                        className="w-full group-hover:border-primary group-hover:text-primary transition-all"
                      >
                        View Guidelines <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full mt-auto"
                    >
                      No Guidelines Yet
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}

            {filtered?.length === 0 && (
              <div className="col-span-full text-center py-20 bg-secondary/20 rounded-xl border border-dashed">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  {search && teamFilter !== "all"
                    ? `No events match "${search}" with the selected team size.`
                    : search
                    ? `No events matching "${search}".`
                    : "No events match the selected team size."}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
