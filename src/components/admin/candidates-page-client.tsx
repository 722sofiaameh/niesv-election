"use client";

import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ButtonLoading } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

import { cn } from "@/lib/utils";

type Candidate = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  registrationNumber: string | null;
  status: "FELLOW" | "MEMBER";
  voteCount: number;
};

type Position = {
  id: string;
  title: string;
  order: number;
  candidates: Candidate[];
};

type Wing = {
  id: string;
  name: string;
  slug: string;
  positions: Position[];
};

type CandidateFormState = {
  name: string;
  bio: string;
  registrationNumber: string;
  status: "FELLOW" | "MEMBER";
  photoUrl: string;
};

const emptyCandidateForm: CandidateFormState = {
  name: "",
  bio: "",
  registrationNumber: "",
  status: "MEMBER",
  photoUrl: "",
};

export function CandidatesPageClient() {
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWings, setExpandedWings] = useState<Set<string>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(
    new Set(),
  );
  const [newWingName, setNewWingName] = useState("");
  const [newPositionTitles, setNewPositionTitles] = useState<
    Record<string, string>
  >({});
  const [editingCandidate, setEditingCandidate] = useState<string | null>(null);
  const [addingCandidateFor, setAddingCandidateFor] = useState<string | null>(
    null,
  );
  const [candidateForm, setCandidateForm] =
    useState<CandidateFormState>(emptyCandidateForm);
  const [uploading, setUploading] = useState(false);

  const refreshWings = useCallback(async () => {
    const response = await fetch("/api/admin/wings");
    const data = await response.json();
    if (response.ok) {
      setWings(data.wings ?? []);
    }
  }, []);

  useEffect(() => {
    refreshWings().finally(() => setLoading(false));
  }, [refreshWings]);

  function toggleWing(id: string) {
    setExpandedWings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePosition(id: string) {
    setExpandedPositions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addWing() {
    if (!newWingName.trim()) return;
    const response = await fetch("/api/admin/wings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWingName }),
    });
    const data = await response.json();
    if (!response.ok) {
      toastError(data.error ?? "Could not add wing.");
      return;
    }
    setNewWingName("");
    await refreshWings();
    success(`Added wing "${data.wing.name}".`);
  }

  async function deleteWing(id: string) {
    const response = await fetch(`/api/admin/wings/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      toastError(data.error ?? "Could not delete wing.");
      return false;
    }
    return true;
  }

  async function handleDeleteWing(wing: Wing) {
    const ok = await confirm({
      title: "Delete wing?",
      description: `"${wing.name}" and all its positions and candidates will be permanently removed.`,
      confirmLabel: "Delete wing",
      cancelLabel: "Cancel",
      variant: "destructive",
    });
    if (!ok) return;

    const deleted = await deleteWing(wing.id);
    if (!deleted) return;

    await refreshWings();
    success(`Removed "${wing.name}".`);
  }

  async function handleDeletePosition(position: Position) {
    const ok = await confirm({
      title: "Delete position?",
      description: `"${position.title}" and all its candidates will be permanently removed.`,
      confirmLabel: "Delete position",
      cancelLabel: "Cancel",
      variant: "destructive",
    });
    if (!ok) return;

    const deleted = await deletePosition(position.id);
    if (!deleted) return;

    await refreshWings();
    success(`Removed "${position.title}".`);
  }

  async function handleDeleteCandidate(candidate: Candidate) {
    const ok = await confirm({
      title: "Delete candidate?",
      description: `"${candidate.name}" will be permanently removed.`,
      confirmLabel: "Delete candidate",
      cancelLabel: "Cancel",
      variant: "destructive",
    });
    if (!ok) return;

    const deleted = await deleteCandidate(candidate.id);
    if (!deleted) return;

    await refreshWings();
    success(`Removed "${candidate.name}".`);
  }

  async function addPosition(wingId: string) {
    const title = newPositionTitles[wingId]?.trim();
    if (!title) return;
    const response = await fetch("/api/admin/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wingId, title }),
    });
    const data = await response.json();
    if (!response.ok) {
      toastError(data.error ?? "Could not add position.");
      return;
    }
    setNewPositionTitles((prev) => ({ ...prev, [wingId]: "" }));
    await refreshWings();
    success(`Added position "${title}".`);
  }

  async function deletePosition(id: string) {
    const response = await fetch(`/api/admin/positions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      toastError(data.error ?? "Could not delete position.");
      return false;
    }
    return true;
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) {
      toastError(data.error ?? "Upload failed.");
      return;
    }
    setCandidateForm((prev) => ({ ...prev, photoUrl: data.url }));
    success("Photo uploaded.");
  }

  function startAddCandidate(positionId: string) {
    setAddingCandidateFor(positionId);
    setEditingCandidate(null);
    setCandidateForm(emptyCandidateForm);
  }

  function startEditCandidate(candidate: Candidate) {
    setEditingCandidate(candidate.id);
    setAddingCandidateFor(null);
    setCandidateForm({
      name: candidate.name,
      bio: candidate.bio ?? "",
      registrationNumber: candidate.registrationNumber ?? "",
      status: candidate.status,
      photoUrl: candidate.photoUrl ?? "",
    });
  }

  async function saveCandidate(positionId: string) {
    const payload = {
      name: candidateForm.name,
      bio: candidateForm.bio,
      registrationNumber: candidateForm.registrationNumber,
      status: candidateForm.status,
      photoUrl: candidateForm.photoUrl || null,
    };

    const isEdit = Boolean(editingCandidate);
    const response = isEdit
      ? await fetch(`/api/admin/candidates/${editingCandidate}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, positionId }),
        });

    const data = await response.json();
    if (!response.ok) {
      toastError(data.error ?? "Could not save candidate.");
      return;
    }

    setEditingCandidate(null);
    setAddingCandidateFor(null);
    setCandidateForm(emptyCandidateForm);
    await refreshWings();
    success(isEdit ? `Updated ${payload.name}.` : `Added ${payload.name}.`);
  }

  async function deleteCandidate(id: string) {
    const response = await fetch(`/api/admin/candidates/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      toastError(data.error ?? "Could not delete candidate.");
      return false;
    }
    return true;
  }

  function renderCandidateForm(positionId: string) {
    return (
      <div className="mt-3 space-y-3 rounded-xl border-2 border-border bg-secondary/50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Candidate name"
            value={candidateForm.name}
            onChange={(e) =>
              setCandidateForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="admin-input"
          />
          <select
            value={candidateForm.status}
            onChange={(e) =>
              setCandidateForm((prev) => ({
                ...prev,
                status: e.target.value as "FELLOW" | "MEMBER",
              }))
            }
            className="admin-input"
          >
            <option value="MEMBER">Member</option>
            <option value="FELLOW">Fellow</option>
          </select>
        </div>
        <input
          placeholder="Registration number (optional)"
          value={candidateForm.registrationNumber}
          onChange={(e) =>
            setCandidateForm((prev) => ({
              ...prev,
              registrationNumber: e.target.value,
            }))
          }
          className="admin-input"
        />
        <textarea
          placeholder="Bio (optional)"
          value={candidateForm.bio}
          rows={3}
          onChange={(e) =>
            setCandidateForm((prev) => ({ ...prev, bio: e.target.value }))
          }
          className="admin-input min-h-[5rem] py-2"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
            className="text-sm"
          />
          {uploading && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="xs" variant="accent" label="Uploading photo" />
              Uploading photo…
            </span>
          )}
          {candidateForm.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidateForm.photoUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!candidateForm.name.trim()}
            onClick={() => saveCandidate(positionId)}
            className="voter-btn-primary px-5 py-2 text-base"
          >
            Save candidate
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingCandidateFor(null);
              setEditingCandidate(null);
            }}
            className="voter-btn-secondary px-5 py-2 text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="voter-card space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="admin-page-title">Candidates</h2>
        <p className="admin-page-desc">
          Manage wings, positions, and candidates.
        </p>
      </div>

      <section className="voter-card">
        <h3 className="text-lg font-semibold">Add wing</h3>
        <div className="mt-3 flex gap-2">
          <input
            placeholder="Wing name"
            value={newWingName}
            onChange={(e) => setNewWingName(e.target.value)}
            className="admin-input flex-1"
          />
          <button type="button" onClick={addWing} className="voter-btn-primary inline-flex items-center gap-2 px-5 py-2 text-base">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </section>

      <div className="space-y-4">
        {wings.map((wing) => (
          <div key={wing.id} className="voter-card p-0">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <button
                type="button"
                onClick={() => toggleWing(wing.id)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    expandedWings.has(wing.id) && "rotate-90",
                  )}
                />
                <span className="text-lg font-semibold">{wing.name}</span>
                <span className="text-xs text-muted-foreground">
                  {wing.positions.length} position(s)
                </span>
              </button>
              <button
                type="button"
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                onClick={() => handleDeleteWing(wing)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {expandedWings.has(wing.id) && (
              <div className="border-t px-4 py-4 pl-8">
                <div className="mb-4 flex gap-2">
                  <input
                    placeholder="New position title"
                    value={newPositionTitles[wing.id] ?? ""}
                    onChange={(e) =>
                      setNewPositionTitles((prev) => ({
                        ...prev,
                        [wing.id]: e.target.value,
                      }))
                    }
                    className="admin-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => addPosition(wing.id)}
                    className="voter-btn-secondary px-4 py-2 text-base"
                  >
                    Add position
                  </button>
                </div>

                {wing.positions.map((position) => (
                  <div
                    key={position.id}
                    className="mb-4 rounded-xl border-2 border-dashed border-border"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => togglePosition(position.id)}
                        className="flex flex-1 items-center gap-2 text-left text-sm"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200",
                            expandedPositions.has(position.id) && "rotate-90",
                          )}
                        />
                        <span className="font-medium">{position.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {position.candidates.length} candidate(s)
                        </span>
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeletePosition(position)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {expandedPositions.has(position.id) && (
                      <div className="space-y-2 border-t px-3 py-3">
                        {position.candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 text-sm",
                              editingCandidate === candidate.id && "border-foreground",
                            )}
                          >
                            {candidate.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={candidate.photoUrl}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                {candidate.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{candidate.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {candidate.status} · {candidate.voteCount} votes
                              </p>
                              {candidate.bio && (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {candidate.bio}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="rounded p-1.5 hover:bg-muted"
                                onClick={() => startEditCandidate(candidate)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="rounded p-1.5 hover:bg-muted hover:text-destructive"
                                onClick={() => handleDeleteCandidate(candidate)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {editingCandidate &&
                          position.candidates.some(
                            (c) => c.id === editingCandidate,
                          ) &&
                          renderCandidateForm(position.id)}

                        {addingCandidateFor === position.id ? (
                          renderCandidateForm(position.id)
                        ) : (
                          <button
                            type="button"
                            onClick={() => startAddCandidate(position.id)}
                            className="voter-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-base"
                          >
                            <Plus className="h-4 w-4" />
                            Add candidate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {wings.length === 0 && (
          <p className="text-base text-muted-foreground">
            No wings yet. Add a wing to get started.
          </p>
        )}
      </div>
    </div>
  );
}
