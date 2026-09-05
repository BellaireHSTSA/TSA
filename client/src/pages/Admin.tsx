import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  LogOut,
  Lock,
  Upload,
  Trophy,
  Users,
  Calendar,
  FileText,
  Settings as SettingsIcon,
  HelpCircle,
  BookOpen,
  ExternalLink,
  Link as LinkIcon,
  GripVertical,
} from "lucide-react";
import type { Champion, Officer, Event, Faq, Resource } from "@shared/schema";

const SESSION_KEY = "bhs_tsa_admin_pw";

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("attached_assets/")) {
    return (
      "/media/" +
      url
        .replace("attached_assets/", "")
        .split("/")
        .map(encodeURIComponent)
        .join("/")
    );
  }
  return url;
}

function ImagePreview({ url }: { url?: string }) {
  const src = resolveUrl(url);
  if (!src) return null;
  if (/\.(mp4|webm|ogg|mov)$/i.test(src))
    return (
      <video
        src={src}
        controls
        className="mt-2 w-full rounded max-h-36 object-cover"
      />
    );
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    const id = src.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    return (
      <iframe
        className="mt-2 w-full aspect-video rounded"
        src={`https://www.youtube.com/embed/${id}`}
        allowFullScreen
      />
    );
  }
  return (
    <img
      src={src}
      alt="Preview"
      className="mt-2 w-full rounded max-h-36 object-cover border"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

// ── Settings save helper ──────────────────────────────────────────────────────

async function saveSettings(updates: Record<string, string>): Promise<void> {
  const pw = sessionStorage.getItem(SESSION_KEY) ?? "";
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      fetch(`/api/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Password": pw },
        body: JSON.stringify({ value }),
      }).then(async (r) => {
        if (!r.ok) throw new Error("Failed to save " + key);
      }),
    ),
  );
}

function useSaveSettings() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Saved!" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });
}

// ── File uploader ─────────────────────────────────────────────────────────────

function FileUploadButton({
  onUploaded,
}: {
  onUploaded: (path: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { path } = await res.json();
      onUploaded(path);
      toast({ title: "File uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="shrink-0"
      >
        <Upload className="h-3.5 w-3.5 mr-1" />
        {uploading ? "Uploading…" : "Upload"}
      </Button>
    </>
  );
}

function ImageField({
  form,
  name,
  label = "Photo / Video",
}: {
  form: any;
  name: string;
  label?: string;
}) {
  const value = form.watch(name);
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <Input
                placeholder="attached_assets/photo.jpg or https://…"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FileUploadButton
              onUploaded={(p) => form.setValue(name, p, { shouldDirty: true })}
            />
          </div>
          <ImagePreview url={value} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ── Drag-and-drop helpers ─────────────────────────────────────────────────────

type DragProps = {
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

async function reorderItems<T extends { id: number }>(
  items: T[],
  fromId: number,
  toId: number,
  endpoint: string,
  queryKey: string,
) {
  if (fromId === toId) return;
  const fromIdx = items.findIndex((i) => i.id === fromId);
  const toIdx = items.findIndex((i) => i.id === toId);
  if (fromIdx === -1 || toIdx === -1) return;
  const next = [...items];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  await Promise.all(
    next.map((item, pos) =>
      apiRequest("PATCH", `${endpoint}/${item.id}`, { position: pos }),
    ),
  );
  queryClient.invalidateQueries({ queryKey: [queryKey] });
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "champions", label: "Champions", icon: Trophy },
  { id: "officers", label: "Officers", icon: Users },
  { id: "events", label: "Events", icon: Calendar },
  { id: "members", label: "Members", icon: FileText },
  { id: "meetings", label: "Meetings", icon: FileText },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ══════════════════════════════════════════════════════════════════════════════
// CHAMPIONS
// ══════════════════════════════════════════════════════════════════════════════

const championSchema = z.object({
  memberName: z.string().min(1, "Required"),
  eventTitle: z.string().min(1, "Required"),
  placement: z.string().min(1, "Required"),
  level: z.enum(["Regionals", "State", "Nationals"]),
  year: z.string().min(4, "Required"),
  notes: z.string().optional(),
  mediaUrl: z.string().optional(),
});
type ChampionForm = z.infer<typeof championSchema>;

function ChampionFormFields({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="memberName"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Member Name(s)</FormLabel>
            <FormControl>
              <Input placeholder="Jane Smith, John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="eventTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event</FormLabel>
            <FormControl>
              <Input placeholder="Manufacturing Prototype" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="placement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Placement</FormLabel>
            <FormControl>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                {...field}
              >
                <option value="">Select…</option>
                <option>1st Place</option>
                <option>2nd Place</option>
                <option>3rd Place</option>
                <option>Finalist</option>
                <option>Semi-Finalist</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Level</FormLabel>
            <FormControl>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                {...field}
              >
                <option value="">Select…</option>
                <option>Regionals</option>
                <option>State</option>
                <option>Nationals</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="year"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Year</FormLabel>
            <FormControl>
              <Input placeholder="2025" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="sm:col-span-2">
        <ImageField form={form} name="mediaUrl" />
      </div>
    </div>
  );
}

function ChampionRow({
  champion,
  drag,
}: {
  champion: Champion;
  drag: DragProps;
}) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const form = useForm<ChampionForm>({
    resolver: zodResolver(championSchema),
    defaultValues: {
      memberName: champion.memberName,
      eventTitle: champion.eventTitle,
      placement: champion.placement,
      level: champion.level as any,
      year: champion.year,
      notes: champion.notes ?? "",
      mediaUrl: champion.mediaUrl ?? "",
    },
  });
  const saveMutation = useMutation({
    mutationFn: (d: ChampionForm) =>
      apiRequest("PATCH", `/api/champions/${champion.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/champions"] });
      toast({ title: "Saved!" });
      setEditing(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/champions/${champion.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/champions"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  if (editing)
    return (
      <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
        <div className="flex justify-between">
          <p className="font-semibold text-sm">Editing champion</p>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}
            className="space-y-4"
          >
            <ChampionFormFields form={form} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                <Check className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "");
        drag.onDragStart();
      }}
      onDragOver={drag.onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
      className={cn(
        "flex items-center gap-3 border rounded-xl px-4 py-3 bg-card hover:bg-muted/30 transition-all",
        drag.isDragging && "opacity-30",
        drag.isOver && "ring-2 ring-primary border-primary",
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
      {champion.mediaUrl && (
        <img
          src={resolveUrl(champion.mediaUrl) ?? ""}
          alt=""
          className="h-10 w-10 rounded object-cover shrink-0 border"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{champion.memberName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {champion.eventTitle} · {champion.placement} · {champion.level} ·{" "}
          {champion.year}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Delete?")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ChampionsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const { data: champions = [], isLoading } = useQuery<Champion[]>({
    queryKey: ["/api/champions"],
    staleTime: 0,
  });
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const form = useForm<ChampionForm>({
    resolver: zodResolver(championSchema),
    defaultValues: {
      memberName: "",
      eventTitle: "",
      placement: "",
      level: "Nationals",
      year: String(new Date().getFullYear()),
      notes: "",
      mediaUrl: "",
    },
  });
  const addMutation = useMutation({
    mutationFn: (d: ChampionForm) => apiRequest("POST", "/api/champions", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/champions"] });
      form.reset();
      toast({ title: "Added!" });
      setShowAdd(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  return (
    <div className="space-y-6">
      <section className="border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 font-semibold text-sm bg-card hover:bg-muted/40 transition-colors"
          onClick={() => setShowAdd(!showAdd)}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add a champion
          </span>
          <span className="text-muted-foreground text-xs">
            {showAdd ? "▲" : "▼"}
          </span>
        </button>
        {showAdd && (
          <div className="p-5 border-t bg-background">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => addMutation.mutate(d))}
                className="space-y-4"
              >
                <ChampionFormFields form={form} />
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addMutation.isPending ? "Adding…" : "Add Champion"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </section>
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          All entries ({champions.length})
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : champions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No champions yet.</p>
        ) : (
          <div className="space-y-2">
            {champions.map((c) => (
              <ChampionRow
                key={c.id}
                champion={c}
                drag={{
                  isDragging: dragId === c.id,
                  isOver: overId === c.id,
                  onDragStart: () => setDragId(c.id),
                  onDragOver: (e) => {
                    e.preventDefault();
                    setOverId(c.id);
                  },
                  onDrop: () => {
                    if (dragId !== null && overId !== null)
                      reorderItems(
                        champions,
                        dragId,
                        overId,
                        "/api/champions",
                        "/api/champions",
                      );
                    setDragId(null);
                    setOverId(null);
                  },
                  onDragEnd: () => {
                    setDragId(null);
                    setOverId(null);
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OFFICERS
// ══════════════════════════════════════════════════════════════════════════════

const officerSchema = z.object({
  name: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});
type OfficerForm = z.infer<typeof officerSchema>;

function OfficerFormFields({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Jane Smith" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <FormControl>
              <Input placeholder="President" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Email{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="jane@example.com"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>
              Bio{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                rows={2}
                placeholder="Short bio…"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="sm:col-span-2">
        <ImageField form={form} name="imageUrl" label="Photo" />
      </div>
    </div>
  );
}

function OfficerRow({ officer, drag }: { officer: Officer; drag: DragProps }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const form = useForm<OfficerForm>({
    resolver: zodResolver(officerSchema),
    defaultValues: {
      name: officer.name,
      role: officer.role,
      description: officer.description ?? "",
      imageUrl: officer.imageUrl ?? "",
      email: officer.email ?? "",
    },
  });
  const saveMutation = useMutation({
    mutationFn: (d: OfficerForm) =>
      apiRequest("PATCH", `/api/officers/${officer.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/officers"] });
      toast({ title: "Saved!" });
      setEditing(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/officers/${officer.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/officers"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  if (editing)
    return (
      <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
        <div className="flex justify-between">
          <p className="font-semibold text-sm">Editing: {officer.name}</p>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}
            className="space-y-4"
          >
            <OfficerFormFields form={form} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                <Check className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "");
        drag.onDragStart();
      }}
      onDragOver={drag.onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
      className={cn(
        "flex items-center gap-3 border rounded-xl px-4 py-3 bg-card hover:bg-muted/30 transition-all",
        drag.isDragging && "opacity-30",
        drag.isOver && "ring-2 ring-primary border-primary",
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
      {officer.imageUrl ? (
        <img
          src={resolveUrl(officer.imageUrl) ?? ""}
          alt=""
          className="h-10 w-10 rounded-full object-cover shrink-0 border"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-primary/10 shrink-0 flex items-center justify-center text-primary font-bold text-sm">
          {officer.name[0]}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{officer.name}</p>
        <p className="text-xs text-muted-foreground">{officer.role}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Delete?")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function OfficersTab() {
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const { data: officers = [], isLoading } = useQuery<Officer[]>({
    queryKey: ["/api/officers"],
    staleTime: 0,
  });
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const form = useForm<OfficerForm>({
    resolver: zodResolver(officerSchema),
    defaultValues: {
      name: "",
      role: "",
      description: "",
      imageUrl: "",
      email: "",
    },
  });
  const addMutation = useMutation({
    mutationFn: (d: OfficerForm) => apiRequest("POST", "/api/officers", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/officers"] });
      form.reset();
      toast({ title: "Added!" });
      setShowAdd(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  return (
    <div className="space-y-6">
      <section className="border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 font-semibold text-sm bg-card hover:bg-muted/40 transition-colors"
          onClick={() => setShowAdd(!showAdd)}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add an officer
          </span>
          <span className="text-muted-foreground text-xs">
            {showAdd ? "▲" : "▼"}
          </span>
        </button>
        {showAdd && (
          <div className="p-5 border-t bg-background">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => addMutation.mutate(d))}
                className="space-y-4"
              >
                <OfficerFormFields form={form} />
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addMutation.isPending ? "Adding…" : "Add Officer"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </section>
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          All officers ({officers.length})
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : officers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No officers yet.</p>
        ) : (
          <div className="space-y-2">
            {officers.map((o) => (
              <OfficerRow
                key={o.id}
                officer={o}
                drag={{
                  isDragging: dragId === o.id,
                  isOver: overId === o.id,
                  onDragStart: () => setDragId(o.id),
                  onDragOver: (e) => {
                    e.preventDefault();
                    setOverId(o.id);
                  },
                  onDrop: () => {
                    if (dragId !== null && overId !== null)
                      reorderItems(
                        officers,
                        dragId,
                        overId,
                        "/api/officers",
                        "/api/officers",
                      );
                    setDragId(null);
                    setOverId(null);
                  },
                  onDragEnd: () => {
                    setDragId(null);
                    setOverId(null);
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════════════════════════

const eventSchema = z.object({
  title: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  difficulty: z.enum(["Demanding", "Hard", "Medium"]),
  description: z.string().min(1, "Required"),
  guidelinesUrl: z.string().optional(),
  teamSizeMin: z.string().optional(),
  teamSizeMax: z.string().optional(),
  numTeamsMin: z.string().optional(),
  numTeamsMax: z.string().optional(),
});
type EventForm = z.infer<typeof eventSchema>;
function toEventPayload(d: EventForm) {
  return {
    title: d.title,
    category: d.category,
    difficulty: d.difficulty,
    description: d.description,
    guidelinesUrl: d.guidelinesUrl || null,
    teamSizeMin: d.teamSizeMin ? parseInt(d.teamSizeMin) : null,
    teamSizeMax: d.teamSizeMax ? parseInt(d.teamSizeMax) : null,
    numTeamsMin: d.numTeamsMin ? parseInt(d.numTeamsMin) : null,
    numTeamsMax: d.numTeamsMax ? parseInt(d.numTeamsMax) : null,
  };
}

function EventFormFields({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Event Title</FormLabel>
            <FormControl>
              <Input placeholder="Web Design" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                {...field}
              >
                <option value="UTE">UTE</option>
                <option value="NQE">NQE</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="difficulty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Difficulty</FormLabel>
            <select {...field} className="w-full border rounded-md p-2">
              <option value="Demanding">Demanding</option>
              <option value="Hard">Hard</option>
              <option value="Medium">Medium</option>
            </select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="guidelinesUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Guidelines URL{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="https://tsaweb.org/competitions/tsa/events/..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="What this event involves…"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="teamSizeMin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Min Team Size{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="1"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="teamSizeMax"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Max Team Size{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="3"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="numTeamsMin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Min # of Teams{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="1"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="numTeamsMax"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Max # of Teams{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="2"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function EventRow({ event, drag }: { event: Event; drag: DragProps }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const form = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event.title,
      category: event.category,
      description: event.description,
      difficulty: event.difficulty ?? "Medium",
      guidelinesUrl: event.guidelinesUrl ?? "",
      teamSizeMin: event.teamSizeMin?.toString() ?? "",
      teamSizeMax: event.teamSizeMax?.toString() ?? "",
      numTeamsMin: event.numTeamsMin?.toString() ?? "",
      numTeamsMax: event.numTeamsMax?.toString() ?? "",
    },
  });
  const saveMutation = useMutation({
    mutationFn: (d: EventForm) =>
      apiRequest("PATCH", `/api/events/${event.id}`, toEventPayload(d)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Saved!" });
      setEditing(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/events/${event.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  if (editing)
    return (
      <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
        <div className="flex justify-between">
          <p className="font-semibold text-sm truncate">
            Editing: {event.title}
          </p>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}
            className="space-y-4"
          >
            <EventFormFields form={form} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                <Check className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "");
        drag.onDragStart();
      }}
      onDragOver={drag.onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
      className={cn(
        "flex items-center gap-3 border rounded-xl px-4 py-3 bg-card hover:bg-muted/30 transition-all",
        drag.isDragging && "opacity-30",
        drag.isOver && "ring-2 ring-primary border-primary",
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {event.category}
          {event.teamSizeMin
            ? ` · ${event.teamSizeMin}–${event.teamSizeMax ?? "?"} members`
            : ""}
          {event.numTeamsMin
            ? ` · ${event.numTeamsMin}–${event.numTeamsMax ?? "?"} teams`
            : ""}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Delete?")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EventsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    staleTime: 0,
  });
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const form = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      category: "UTE",
      difficulty: "Medium",
      description: "",
      guidelinesUrl: "",
      teamSizeMin: "",
      teamSizeMax: "",
      numTeamsMin: "",
      numTeamsMax: "",
    },
  });
  const addMutation = useMutation({
    mutationFn: (d: EventForm) =>
      apiRequest("POST", "/api/events", toEventPayload(d)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      form.reset({
        title: "",
        category: "UTE",
        difficulty: "Medium",
        description: "",
        guidelinesUrl: "",
        teamSizeMin: "",
        teamSizeMax: "",
        numTeamsMin: "",
        numTeamsMax: "",
      });
      toast({ title: "Added!" });
      setShowAdd(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  return (
    <div className="space-y-6">
      <section className="border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 font-semibold text-sm bg-card hover:bg-muted/40 transition-colors"
          onClick={() => setShowAdd(!showAdd)}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add an event
          </span>
          <span className="text-muted-foreground text-xs">
            {showAdd ? "▲" : "▼"}
          </span>
        </button>
        {showAdd && (
          <div className="p-5 border-t bg-background">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => addMutation.mutate(d))}
                className="space-y-4"
              >
                <EventFormFields form={form} />
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addMutation.isPending ? "Adding…" : "Add Event"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </section>
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          All events ({events.length})
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                drag={{
                  isDragging: dragId === e.id,
                  isOver: overId === e.id,
                  onDragStart: () => setDragId(e.id),
                  onDragOver: (e2) => {
                    e2.preventDefault();
                    setOverId(e.id);
                  },
                  onDrop: () => {
                    if (dragId !== null && overId !== null)
                      reorderItems(
                        events,
                        dragId,
                        overId,
                        "/api/events",
                        "/api/events",
                      );
                    setDragId(null);
                    setOverId(null);
                  },
                  onDragEnd: () => {
                    setDragId(null);
                    setOverId(null);
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MEMBERS PAGE EDITOR
// ══════════════════════════════════════════════════════════════════════════════

const membersSchema = z.object({
  status_title: z.string().min(1, "Required"),
  status_desc: z.string().min(1, "Required"),
  registration_open: z.enum(["true", "false"]),
  competitions_text: z.string(),
  leadership_text: z.string(),
  resources_text: z.string(),
});
type MembersForm = z.infer<typeof membersSchema>;

function MembersTab() {
  const { data: s = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    staleTime: 0,
  });
  const saveMutation = useSaveSettings();
  const form = useForm<MembersForm>({
    resolver: zodResolver(membersSchema),
    defaultValues: {
      status_title: "",
      status_desc: "",
      registration_open: "false",
      competitions_text: "",
      leadership_text: "",
      resources_text: "",
    },
  });

  useEffect(() => {
    if (Object.keys(s).length > 0) {
      form.reset({
        status_title:
          s.members_status_title ?? "Registration is Currently Closed",
        status_desc: s.members_status_desc ?? "",
        registration_open: (s.members_registration_open === "true"
          ? "true"
          : "false") as "true" | "false",
        competitions_text: s.members_competitions_text ?? "",
        leadership_text: s.members_leadership_text ?? "",
        resources_text: s.members_resources_text ?? "",
      });
    }
  }, [JSON.stringify(s)]);

  const onSubmit = (d: MembersForm) => {
    saveMutation.mutate({
      members_status_title: d.status_title,
      members_status_desc: d.status_desc,
      members_registration_open: d.registration_open,
      members_competitions_text: d.competitions_text,
      members_leadership_text: d.leadership_text,
      members_resources_text: d.resources_text,
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Edit the content shown on the <strong>Members</strong> page.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="border rounded-xl p-5 space-y-4 bg-card">
            <h3 className="font-semibold text-sm">Status Banner</h3>
            <FormField
              control={form.control}
              name="registration_open"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      {...field}
                    >
                      <option value="false">
                        Closed — "Join Waiting List"
                      </option>
                      <option value="true">Open — "Join Now"</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Headline</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border rounded-xl p-5 space-y-4 bg-card">
            <h3 className="font-semibold text-sm">Benefit Cards</h3>
            <FormField
              control={form.control}
              name="competitions_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competitions card text</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leadership_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leadership card text</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resources_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resources card text</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving…" : "Save Members Page"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MEETINGS PAGE EDITOR
// ══════════════════════════════════════════════════════════════════════════════

interface AgendaItem {
  date: string;
  time: string;
  topic: string;
  type: string;
}

const meetingInfoSchema = z.object({
  general_desc: z.string(),
  general_schedule: z.string(),
  general_location: z.string(),
  officer_desc: z.string(),
  officer_schedule: z.string(),
  officer_location: z.string(),
});
type MeetingInfoForm = z.infer<typeof meetingInfoSchema>;

function MeetingsTab() {
  const { data: s = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    staleTime: 0,
  });
  const saveMutation = useSaveSettings();
  const { toast } = useToast();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [savingAgenda, setSavingAgenda] = useState(false);

  const form = useForm<MeetingInfoForm>({
    resolver: zodResolver(meetingInfoSchema),
    defaultValues: {
      general_desc: "",
      general_schedule: "",
      general_location: "",
      officer_desc: "",
      officer_schedule: "",
      officer_location: "",
    },
  });

  useEffect(() => {
    if (Object.keys(s).length > 0) {
      form.reset({
        general_desc: s.meetings_general_desc ?? "",
        general_schedule: s.meetings_general_schedule ?? "",
        general_location: s.meetings_general_location ?? "",
        officer_desc: s.meetings_officer_desc ?? "",
        officer_schedule: s.meetings_officer_schedule ?? "",
        officer_location: s.meetings_officer_location ?? "",
      });
      try {
        setAgenda(JSON.parse(s.meetings_agenda ?? "[]"));
      } catch {
        setAgenda([]);
      }
    }
  }, [JSON.stringify(s)]);

  const onSubmit = (d: MeetingInfoForm) => {
    saveMutation.mutate({
      meetings_general_desc: d.general_desc,
      meetings_general_schedule: d.general_schedule,
      meetings_general_location: d.general_location,
      meetings_officer_desc: d.officer_desc,
      meetings_officer_schedule: d.officer_schedule,
      meetings_officer_location: d.officer_location,
    });
  };

  const saveAgenda = async () => {
    setSavingAgenda(true);
    try {
      await saveSettings({ meetings_agenda: JSON.stringify(agenda) });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Agenda saved!" });
    } catch {
      toast({ title: "Failed to save agenda", variant: "destructive" });
    } finally {
      setSavingAgenda(false);
    }
  };

  const updateRow = (i: number, field: keyof AgendaItem, val: string) =>
    setAgenda((a) =>
      a.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)),
    );
  const addRow = () =>
    setAgenda((a) => [
      ...a,
      { date: "", time: "", topic: "", type: "General" },
    ]);
  const removeRow = (i: number) =>
    setAgenda((a) => a.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Edit the content shown on the <strong>Meetings</strong> page.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="border rounded-xl p-5 space-y-4 bg-card">
            <h3 className="font-semibold text-sm">General Meetings</h3>
            <FormField
              control={form.control}
              name="general_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general_schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule</FormLabel>
                  <FormControl>
                    <Input placeholder="Every other Tuesday…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Room 2607…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving…" : "Save Meeting Info"}
          </Button>
        </form>
      </Form>

      {/* Agenda editor */}
      <div className="border rounded-xl p-5 space-y-4 bg-card">
        <h3 className="font-semibold text-sm">Upcoming Agenda Items</h3>
        <div className="space-y-2">
          {agenda.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No agenda items yet.
            </p>
          )}
          {agenda.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-center"
            >
              <Input
                value={row.date}
                onChange={(e) => updateRow(i, "date", e.target.value)}
                placeholder="Aug 20, 2026"
                className="text-sm"
              />
              <Input
                value={row.time}
                onChange={(e) => updateRow(i, "time", e.target.value)}
                placeholder="12:30 PM"
                className="text-sm"
              />
              <Input
                value={row.topic}
                onChange={(e) => updateRow(i, "topic", e.target.value)}
                placeholder="Interest Meeting"
                className="text-sm"
              />
              <select
                value={row.type}
                onChange={(e) => updateRow(i, "type", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option>General</option>
                <option>Officer</option>
                <option>Conference</option>
                <option>Other</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => removeRow(i)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" />
            Add row
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={saveAgenda}
            disabled={savingAgenda}
          >
            <Check className="h-4 w-4 mr-1" />
            {savingAgenda ? "Saving…" : "Save Agenda"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS (PASSWORD CHANGE)
// ══════════════════════════════════════════════════════════════════════════════

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(4, "At least 4 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type PwForm = z.infer<typeof pwSchema>;

function SettingsTab() {
  const { toast } = useToast();
  const form = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePw = useMutation({
    mutationFn: async (d: PwForm) => {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: d.currentPassword,
          newPassword: d.newPassword,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message);
      }
    },
    onSuccess: (_, d) => {
      sessionStorage.setItem(SESSION_KEY, d.newPassword);
      toast({ title: "Password changed! You're still signed in." });
      form.reset();
    },
    onError: (e: Error) =>
      toast({
        title: e.message || "Failed to change password",
        variant: "destructive",
      }),
  });

  return (
    <div className="space-y-6 max-w-md">
      <p className="text-sm text-muted-foreground">
        Change the password used to access this admin page.
      </p>
      <div className="border rounded-xl p-5 bg-card space-y-4">
        <h3 className="font-semibold text-sm">Change Password</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => changePw.mutate(d))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={changePw.isPending}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              {changePw.isPending ? "Changing…" : "Change Password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESOURCES
// ══════════════════════════════════════════════════════════════════════════════

const resourceSchema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  url: z.string().min(1, "Required"),
  category: z.string().optional(),
});
type ResourceForm = z.infer<typeof resourceSchema>;

function ResourceFileUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      onUploaded(data.url);
    } catch {
    } finally {
      setUploading(false);
    }
  };
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="shrink-0"
      >
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        {uploading ? "Uploading…" : "Upload file"}
      </Button>
    </>
  );
}

function ResourceFormFields({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="TSA Membership Handbook" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Category{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Forms, Competition, General"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Link or File</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input placeholder="https://… or upload a file →" {...field} />
              </FormControl>
              <ResourceFileUpload
                onUploaded={(url) =>
                  form.setValue("url", url, { shouldValidate: true })
                }
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                rows={2}
                placeholder="Brief description of this resource…"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function ResourceRow({
  resource,
  drag,
}: {
  resource: Resource;
  drag: DragProps;
}) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const form = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource.title,
      description: resource.description ?? "",
      url: resource.url,
      category: resource.category ?? "",
    },
  });
  const saveMutation = useMutation({
    mutationFn: (d: ResourceForm) =>
      apiRequest("PATCH", `/api/resources/${resource.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Saved!" });
      setEditing(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/resources/${resource.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const isFile = resource.url.startsWith("attached_assets/");

  if (editing)
    return (
      <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-sm">Editing resource</p>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}
            className="space-y-4"
          >
            <ResourceFormFields form={form} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                <Check className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "");
        drag.onDragStart();
      }}
      onDragOver={drag.onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
      className={cn(
        "flex items-start gap-2 border rounded-xl px-4 py-3 bg-card hover:bg-muted/30 transition-all",
        drag.isDragging && "opacity-30",
        drag.isOver && "ring-2 ring-primary border-primary",
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing mt-0.5" />
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs">
        {isFile ? (
          <FileText className="h-3.5 w-3.5" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{resource.title}</p>
        {resource.category && (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
            {resource.category}
          </span>
        )}
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {resource.url}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Delete this resource?")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ResourcesTab() {
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    staleTime: 0,
  });
  const form = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { title: "", description: "", url: "", category: "" },
  });
  const addMutation = useMutation({
    mutationFn: (d: ResourceForm) =>
      apiRequest("POST", "/api/resources", {
        ...d,
        position: resources.length,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      form.reset();
      toast({ title: "Added!" });
      setShowAdd(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <section className="border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 font-semibold text-sm bg-card hover:bg-muted/40 transition-colors"
          onClick={() => setShowAdd(!showAdd)}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add a resource
          </span>
          <span className="text-muted-foreground text-xs">
            {showAdd ? "▲" : "▼"}
          </span>
        </button>
        {showAdd && (
          <div className="p-5 border-t bg-background">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => addMutation.mutate(d))}
                className="space-y-4"
              >
                <ResourceFormFields form={form} />
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addMutation.isPending ? "Adding…" : "Add Resource"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </section>
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          All resources ({resources.length})
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No resources yet. Add your first one above.
          </p>
        ) : (
          <div className="space-y-2">
            {resources.map((r) => (
              <ResourceRow
                key={r.id}
                resource={r}
                drag={{
                  isDragging: dragId === r.id,
                  isOver: overId === r.id,
                  onDragStart: () => setDragId(r.id),
                  onDragOver: (e) => {
                    e.preventDefault();
                    setOverId(r.id);
                  },
                  onDrop: () => {
                    if (dragId !== null && overId !== null)
                      reorderItems(
                        resources,
                        dragId,
                        overId,
                        "/api/resources",
                        "/api/resources",
                      );
                    setDragId(null);
                    setOverId(null);
                  },
                  onDragEnd: () => {
                    setDragId(null);
                    setOverId(null);
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FAQS
// ══════════════════════════════════════════════════════════════════════════════

const faqSchema = z.object({
  question: z.string().min(1, "Required"),
  answer: z.string().min(1, "Required"),
});
type FaqForm = z.infer<typeof faqSchema>;

function FaqRow({ faq, drag }: { faq: Faq; drag: DragProps }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const form = useForm<FaqForm>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: faq.question, answer: faq.answer },
  });
  const saveMutation = useMutation({
    mutationFn: (d: FaqForm) => apiRequest("PATCH", `/api/faqs/${faq.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({ title: "Saved!" });
      setEditing(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/faqs/${faq.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  if (editing)
    return (
      <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-sm">Editing question</p>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                <Check className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "");
        drag.onDragStart();
      }}
      onDragOver={drag.onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
      className={cn(
        "flex items-start gap-2 border rounded-xl px-4 py-3 bg-card hover:bg-muted/30 transition-all",
        drag.isDragging && "opacity-30",
        drag.isOver && "ring-2 ring-primary border-primary",
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{faq.question}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {faq.answer}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Delete this FAQ?")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FaqsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
    staleTime: 0,
  });
  const form = useForm<FaqForm>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: "", answer: "" },
  });
  const addMutation = useMutation({
    mutationFn: (d: FaqForm) =>
      apiRequest("POST", "/api/faqs", { ...d, position: faqs.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      form.reset();
      toast({ title: "Added!" });
      setShowAdd(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <section className="border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 font-semibold text-sm bg-card hover:bg-muted/40 transition-colors"
          onClick={() => setShowAdd(!showAdd)}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add a question
          </span>
          <span className="text-muted-foreground text-xs">
            {showAdd ? "▲" : "▼"}
          </span>
        </button>
        {showAdd && (
          <div className="p-5 border-t bg-background">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => addMutation.mutate(d))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="How do I join BHS TSA?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Write the answer here…"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addMutation.isPending ? "Adding…" : "Add Question"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </section>
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          All questions ({faqs.length})
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No FAQs yet. Add your first question above.
          </p>
        ) : (
          <div className="space-y-2">
            {faqs.map((faq) => (
              <FaqRow
                key={faq.id}
                faq={faq}
                drag={{
                  isDragging: dragId === faq.id,
                  isOver: overId === faq.id,
                  onDragStart: () => setDragId(faq.id),
                  onDragOver: (e) => {
                    e.preventDefault();
                    setOverId(faq.id);
                  },
                  onDrop: () => {
                    if (dragId !== null && overId !== null)
                      reorderItems(
                        faqs,
                        dragId,
                        overId,
                        "/api/faqs",
                        "/api/faqs",
                      );
                    setDragId(null);
                    setOverId(null);
                  },
                  onDragEnd: () => {
                    setDragId(null);
                    setOverId(null);
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN SHELL
// ══════════════════════════════════════════════════════════════════════════════

function AdminPanel() {
  const [tab, setTab] = useState<TabId>("champions");
  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg font-bold leading-tight">
              BHS TSA Admin
            </h1>
            <p className="text-xs text-muted-foreground">
              Not visible to the public
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
        <div className="w-full px-4 flex overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full px-4 py-8">
        {tab === "champions" && <ChampionsTab />}
        {tab === "officers" && <OfficersTab />}
        {tab === "events" && <EventsTab />}
        {tab === "members" && <MembersTab />}
        {tab === "meetings" && <MeetingsTab />}
        {tab === "faqs" && <FaqsTab />}
        {tab === "resources" && <ResourcesTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════

function LoginGate({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const { valid } = await res.json();
      if (valid) {
        onLogin(pw);
      } else {
        setError("Incorrect password.");
        setPw("");
      }
    } catch {
      setError("Could not connect. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-2xl bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-serif text-xl font-bold">Admin Access</h1>
          <p className="text-sm text-muted-foreground">BHS TSA Site Manager</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError("");
            }}
            autoFocus
            data-testid="input-admin-password"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="button-admin-login"
          >
            {loading ? "Checking…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(
    () => !!sessionStorage.getItem(SESSION_KEY),
  );
  if (!authed)
    return (
      <LoginGate
        onLogin={(pw) => {
          sessionStorage.setItem(SESSION_KEY, pw);
          setAuthed(true);
        }}
      />
    );
  return <AdminPanel />;
}
