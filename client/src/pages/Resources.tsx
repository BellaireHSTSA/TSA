import { PageHeader } from "@/components/PageHeader";
import { ExternalLink, FileText, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import resources from "@/data/resources.json";
import type { Resource } from "@shared/schema";

function resolveUrl(url: string) {
  if (url.startsWith("attached_assets/")) {
    return "/media/" + url.replace("attached_assets/", "").split("/").map(encodeURIComponent).join("/");
  }
  return url;
}

function isPdf(url: string) {
  return /\.(pdf)$/i.test(url);
}

function isFile(url: string) {
  return url.startsWith("attached_assets/");
}

function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
  const resolvedUrl = resolveUrl(resource.url);
  const file = isFile(resource.url);
  const pdf = isPdf(resource.url);

  return (
    <motion.a
      href={resolvedUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex items-start gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      data-testid={`resource-card-${resource.id}`}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {file || pdf ? <FileText className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
          {resource.title}
        </p>
        {resource.description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground/60 truncate">
          {file ? (resource.url.replace("attached_assets/", "").replace(/-\d+(\.\w+)$/, "$1")) : resource.url}
        </p>
      </div>
    </motion.a>
  );
}

const resourceRows = resources as Resource[];

export default function Resources() {
  const grouped = resourceRows.reduce<Record<string, Resource[]>>((acc, r) => {
    const cat = r.category?.trim() || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Resources"
        description="Links, documents, and references for BHS TSA members."
      />

      <div className="w-full mt-12 px-4 sm:px-6">
        {resourceRows.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-40 mb-4" />
            <p className="text-muted-foreground">No resources yet — check back soon!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((cat) => (
              <section key={cat}>
                <h2 className="mb-4 font-serif text-xl font-bold text-foreground border-b pb-2">{cat}</h2>
                <div className="space-y-3">
                  {grouped[cat].map((r, i) => (
                    <ResourceCard key={r.id} resource={r} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
