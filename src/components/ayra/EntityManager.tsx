import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef<T> {
  key: keyof T & string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean";
  options?: FieldOption[];
  placeholder?: string;
  help?: string;
  required?: boolean;
  step?: number;
  wide?: boolean;
}

interface EntityManagerProps<T extends { id: string }> {
  itemLabel: string;
  items: T[];
  fields: FieldDef<T>[];
  createEmpty: () => Omit<T, "id">;
  getTitle: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onSave: (item: T) => void;
  onDelete: (id: string) => void;
  searchKeys: (keyof T & string)[];
  filter?: { key: keyof T & string; label: string; options: FieldOption[] };
  sort?: (a: T, b: T) => number;
  wrapTitle?: boolean;
}

type Draft = Record<string, unknown>;

/** Generic add / edit / delete screen used by every AYRA module page. */
export function EntityManager<T extends { id: string }>({
  itemLabel,
  items,
  fields,
  createEmpty,
  getTitle,
  renderCard,
  onSave,
  onDelete,
  searchKeys,
  filter,
  sort,
  wrapTitle = false,
}: EntityManagerProps<T>) {
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState("ALL");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (filter && filterValue !== "ALL" && String(item[filter.key]) !== filterValue) return false;
      if (!q) return true;
      return searchKeys.some((k) => String(item[k] ?? "").toLowerCase().includes(q));
    });
    return sort ? [...list].sort(sort) : list;
  }, [items, query, filter, filterValue, searchKeys, sort]);

  const openNew = () => {
    setEditingId(null);
    setErrors([]);
    setDraft({ ...createEmpty() } as Draft);
  };
  const openEdit = (item: T) => {
    setEditingId(item.id);
    setErrors([]);
    setDraft({ ...item } as Draft);
  };
  const close = () => setDraft(null);

  const save = () => {
    if (!draft) return;
    const missing = fields
      .filter((f) => f.required && String(draft[f.key] ?? "").trim() === "")
      .map((f) => f.key);
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    const id = editingId ?? crypto.randomUUID();
    onSave({ ...draft, id } as unknown as T);
    toast.success(editingId ? `${itemLabel} updated` : `${itemLabel} added`);
    close();
  };

  const setField = (key: string, value: unknown) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setErrors((e) => e.filter((k) => k !== key));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${itemLabel.toLowerCase()}s…`}
            className="rounded-full bg-card/60 pl-9"
          />
        </div>
        {filter && (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="bg-card/60 sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All {filter.label}s</SelectItem>
              {filter.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={openNew}>
          <Plus /> Add {itemLabel}
        </Button>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Showing {visible.length} of {items.length}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={openNew}
          className="group grid min-h-44 place-items-center rounded-lg border border-dashed border-primary/30 bg-card/30 p-6 text-center transition-all hover:border-primary hover:bg-primary/5"
        >
          <span>
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-md border border-primary/40 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
              <Plus className="h-5 w-5" />
            </span>
            <span className="mt-3 block font-display text-xs uppercase tracking-[0.18em] text-foreground">
              Add new {itemLabel}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">Fill a simple form — done.</span>
          </span>
        </button>

        {visible.map((item) => (
          <article
            key={item.id}
            className="group relative flex flex-col rounded-lg border border-border bg-card/60 p-5 backdrop-blur transition-all hover:border-primary/50"
          >
            <span aria-hidden className="absolute left-0 top-0 h-2 w-2 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <h3 className={cn("font-display text-sm font-semibold uppercase tracking-wider", wrapTitle ? "break-words leading-snug" : "truncate")}>
                {getTitle(item)}
              </h3>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${getTitle(item)}`} onClick={() => openEdit(item)}>
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:text-destructive"
                  aria-label={`Delete ${getTitle(item)}`}
                  onClick={() => setConfirmDelete(item)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex-1 text-sm">{renderCard(item)}</div>
          </article>
        ))}
      </div>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-primary/30 bg-popover sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-[0.14em]">
              {editingId ? `Edit ${itemLabel}` : `New ${itemLabel}`}
            </DialogTitle>
            <DialogDescription>Change any field and press Save. You can edit it again anytime.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const value = draft[f.key];
                const invalid = errors.includes(f.key);
                return (
                  <div key={f.key} className={cn("space-y-1.5", (f.wide || f.type === "textarea") && "sm:col-span-2")}>
                    <Label htmlFor={`field-${f.key}`} className="text-xs uppercase tracking-widest text-muted-foreground">
                      {f.label}
                      {f.required && <span className="text-primary"> *</span>}
                    </Label>
                    {f.type === "text" && (
                      <Input
                        id={`field-${f.key}`}
                        value={String(value ?? "")}
                        placeholder={f.placeholder}
                        onChange={(e) => setField(f.key, e.target.value)}
                        aria-invalid={invalid}
                        className={cn(invalid && "border-destructive")}
                      />
                    )}
                    {f.type === "textarea" && (
                      <Textarea
                        id={`field-${f.key}`}
                        value={String(value ?? "")}
                        placeholder={f.placeholder}
                        rows={3}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    )}
                    {f.type === "number" && (
                      <Input
                        id={`field-${f.key}`}
                        type="number"
                        step={f.step ?? 1}
                        value={String(value ?? 0)}
                        onChange={(e) => setField(f.key, Number(e.target.value))}
                      />
                    )}
                    {f.type === "select" && (
                      <Select value={String(value ?? "")} onValueChange={(v) => setField(f.key, v)}>
                        <SelectTrigger id={`field-${f.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(f.options ?? []).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {f.type === "boolean" && (
                      <div className="flex h-9 items-center gap-3">
                        <Switch id={`field-${f.key}`} checked={Boolean(value)} onCheckedChange={(v) => setField(f.key, v)} />
                        <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
                      </div>
                    )}
                    {invalid && <p className="text-xs text-destructive">Please fill this in</p>}
                    {f.help && !invalid && <p className="text-xs text-muted-foreground">{f.help}</p>}
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save}>Save {itemLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="border-destructive/40 bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete ? getTitle(confirmDelete) : ""}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes it from AYRA. You can add it back later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) {
                  onDelete(confirmDelete.id);
                  toast(`${itemLabel} deleted`);
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
