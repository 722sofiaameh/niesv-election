"use client";

import { ChevronRight, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AdminSelect } from "@/components/ui/admin-select";
import { ButtonLoading } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-fetch";
import { buildCampaignTrackingUrl } from "@/lib/tracking-url";

type Candidate = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  registrationNumber: string | null;
  status: "FELLOW" | "MEMBER";
  voteCount: number;
  trackingToken: string;
};

type Position = {
  id: string;
  title: string;
  order: number;
  maxSelections: number;
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

  const [editingWingId, setEditingWingId] = useState<string | null>(null);
  const [editWingName, setEditWingName] = useState("");
  const [savingWing, setSavingWing] = useState(false);

  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null,
  );
  const [editPositionTitle, setEditPositionTitle] = useState("");
  const [editPositionMaxSelections, setEditPositionMaxSelections] = useState(1);
  const [savingPosition, setSavingPosition] = useState(false);

  const [editingCandidate, setEditingCandidate] = useState<string | null>(
    null,
  );
  const [addingCandidateFor, setAddingCandidateFor] = useState<string | null>(
    null,
  );
  const [candidateForm, setCandidateForm] =
    useState<CandidateFormState>(emptyCandidateForm);
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refreshWings = useCallback(async () => {
    const result = await adminFetch<{ wings: Wing[] }>("/api/admin/wings");
    if (!result.ok) {
      if (result.status !== 401) {
        toastError(result.error ?? "Could not load wings.");
      }
      return;
    }
    setWings(result.data?.wings ?? []);
  }, [toastError]);

  useEffect(() => {
    refreshWings().finally(() => setLoading(false));
  }, [refreshWings]);

  function expandWing(wingId: string) {
    setExpandedWings((prev) => new Set(prev).add(wingId));
  }

  function expandPosition(positionId: string) {
    setExpandedPositions((prev) => new Set(prev).add(positionId));
  }

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

  function resetCandidateFormState() {
    setEditingCandidate(null);
    setAddingCandidateFor(null);
    setCandidateForm(emptyCandidateForm);
  }

  async function copyTrackingLink(candidate: Candidate) {
    const url = buildCampaignTrackingUrl(window.location.origin, candidate.trackingToken);

    try {
      await navigator.clipboard.writeText(url);
      success(`Tracking link copied for ${candidate.name}.`);
    } catch {
      toastError("Could not copy link. Please copy it manually.");
    }
  }

  async function addWing() {
    if (!newWingName.trim()) return;
    const result = await adminFetch<{ wing: Wing }>("/api/admin/wings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWingName }),
    });
    if (!result.ok) {
      toastError(result.error ?? "Could not add wing.");
      return;
    }
    setNewWingName("");
    await refreshWings();
    success(`Added wing "${result.data?.wing.name}".`);
  }

  function startEditWing(wing: Wing) {
    setEditingWingId(wing.id);
    setEditWingName(wing.name);
    expandWing(wing.id);
  }

  function cancelEditWing() {
    setEditingWingId(null);
    setEditWingName("");
  }

  async function saveWing(wingId: string) {
    const name = editWingName.trim();
    if (!name) {
      toastError("Wing name is required.");
      return;
    }

    setSavingWing(true);
    const result = await adminFetch<{ wing: Wing }>(`/api/admin/wings/${wingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingWing(false);

    if (!result.ok) {
      toastError(result.error ?? "Could not save wing.");
      return;
    }

    cancelEditWing();
    await refreshWings();
    success(`Updated wing "${name}".`);
  }

  async function deleteWing(id: string) {
    const result = await adminFetch<{ success?: boolean }>(
      `/api/admin/wings/${id}`,
      { method: "DELETE" },
    );
    if (!result.ok) {
      toastError(result.error ?? "Could not delete wing.");
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

  function startEditPosition(position: Position, wingId: string) {
    setEditingPositionId(position.id);
    setEditPositionTitle(position.title);
    setEditPositionMaxSelections(position.maxSelections ?? 1);
    expandWing(wingId);
    expandPosition(position.id);
  }

  function cancelEditPosition() {
    setEditingPositionId(null);
    setEditPositionTitle("");
    setEditPositionMaxSelections(1);
  }

  async function savePosition(positionId: string) {
    const title = editPositionTitle.trim();
    if (!title) {
      toastError("Position title is required.");
      return;
    }

    if (editPositionMaxSelections < 1 || editPositionMaxSelections > 10) {
      toastError("Selections must be between 1 and 10.");
      return;
    }

    setSavingPosition(true);
    const result = await adminFetch<{ position: Position }>(
      `/api/admin/positions/${positionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          maxSelections: editPositionMaxSelections,
        }),
      },
    );
    setSavingPosition(false);

    if (!result.ok) {
      toastError(result.error ?? "Could not save position.");
      return;
    }

    cancelEditPosition();
    await refreshWings();
    success(`Updated position "${title}".`);
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
    const result = await adminFetch<{ position: Position }>("/api/admin/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wingId, title }),
    });
    if (!result.ok) {
      toastError(result.error ?? "Could not add position.");
      return;
    }
    setNewPositionTitles((prev) => ({ ...prev, [wingId]: "" }));
    expandWing(wingId);
    await refreshWings();
    success(`Added position "${title}".`);
  }

  async function deletePosition(id: string) {
    const result = await adminFetch<{ success?: boolean }>(
      `/api/admin/positions/${id}`,
      { method: "DELETE" },
    );
    if (!result.ok) {
      toastError(result.error ?? "Could not delete position.");
      return false;
    }
    return true;
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await adminFetch<{ url: string }>("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!result.ok) {
      toastError(result.error ?? "Upload failed.");
      return;
    }
    setCandidateForm((prev) => ({ ...prev, photoUrl: result.data?.url ?? "" }));
    success("Photo uploaded.");
  }

  function startAddCandidate(positionId: string, wingId: string) {
    resetCandidateFormState();
    setAddingCandidateFor(positionId);
    expandWing(wingId);
    expandPosition(positionId);
  }

  function startEditCandidate(
    candidate: Candidate,
    wingId: string,
    positionId: string,
  ) {
    setAddingCandidateFor(null);
    setEditingCandidate(candidate.id);
    expandWing(wingId);
    expandPosition(positionId);
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
      name: candidateForm.name.trim(),
      bio: candidateForm.bio,
      registrationNumber: candidateForm.registrationNumber,
      status: candidateForm.status,
      photoUrl: candidateForm.photoUrl || null,
    };

    if (!payload.name) {
      toastError("Candidate name is required.");
      return;
    }

    setSavingCandidate(true);
    const isEdit = Boolean(editingCandidate);
    const result = isEdit
      ? await adminFetch<{ candidate: Candidate }>(
          `/api/admin/candidates/${editingCandidate}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        )
      : await adminFetch<{ candidate: Candidate }>("/api/admin/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, positionId }),
        });

    setSavingCandidate(false);

    if (!result.ok) {
      toastError(result.error ?? "Could not save candidate.");
      return;
    }

    resetCandidateFormState();
    await refreshWings();
    success(isEdit ? `Updated ${payload.name}.` : `Added ${payload.name}.`);
  }

  async function deleteCandidate(id: string) {
    const result = await adminFetch<{ success?: boolean }>(
      `/api/admin/candidates/${id}`,
      { method: "DELETE" },
    );
    if (!result.ok) {
      toastError(result.error ?? "Could not delete candidate.");
      return false;
    }
    return true;
  }

  function renderCandidateForm(positionId: string, mode: "add" | "edit") {
    return (
      <div className="space-y-4 rounded-xl border-2 border-primary/20 bg-secondary/50 p-4">
        <p className="text-sm font-semibold text-foreground">
          {mode === "add" ? "Add candidate" : "Edit candidate"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`candidate-name-${positionId}`} className="mb-2 block text-sm font-semibold">
              Name
            </label>
            <input
              id={`candidate-name-${positionId}`}
              placeholder="Candidate name"
              value={candidateForm.name}
              onChange={(e) =>
                setCandidateForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="admin-input"
            />
          </div>
          <AdminSelect
            id={`candidate-status-${positionId}`}
            label="Membership status"
            value={candidateForm.status}
            onChange={(value) =>
              setCandidateForm((prev) => ({
                ...prev,
                status: value as "FELLOW" | "MEMBER",
              }))
            }
            options={[
              { value: "MEMBER", label: "MEMBER" },
              { value: "FELLOW", label: "FELLOW" },
            ]}
          />
        </div>
        <div>
          <label htmlFor={`candidate-reg-${positionId}`} className="mb-2 block text-sm font-semibold">
            Registration number <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`candidate-reg-${positionId}`}
            placeholder="Registration number"
            value={candidateForm.registrationNumber}
            onChange={(e) =>
              setCandidateForm((prev) => ({
                ...prev,
                registrationNumber: e.target.value,
              }))
            }
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor={`candidate-bio-${positionId}`} className="mb-2 block text-sm font-semibold">
            Bio <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id={`candidate-bio-${positionId}`}
            placeholder="Short bio"
            value={candidateForm.bio}
            rows={3}
            onChange={(e) =>
              setCandidateForm((prev) => ({ ...prev, bio: e.target.value }))
            }
            className="admin-input min-h-[5rem] py-2"
          />
        </div>
        <div>
          <label htmlFor={`candidate-photo-${positionId}`} className="mb-2 block text-sm font-semibold">
            Photo <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id={`candidate-photo-${positionId}`}
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
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!candidateForm.name.trim() || savingCandidate}
            onClick={() => saveCandidate(positionId)}
            className="voter-btn-primary px-5 py-2 text-base"
          >
            {savingCandidate ? (
              <ButtonLoading label="Saving" />
            ) : mode === "add" ? (
              "Add candidate"
            ) : (
              "Save changes"
            )}
          </button>
          <button
            type="button"
            onClick={resetCandidateFormState}
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
          Expand a wing and position to add or edit candidates. Use the Edit
          buttons to fix names, titles, or other details.
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
          <button
            type="button"
            onClick={addWing}
            className="voter-btn-primary inline-flex items-center gap-2 px-5 py-2 text-base"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </section>

      <div className="space-y-4">
        {wings.map((wing) => (
          <div key={wing.id} className="voter-card p-0">
            {editingWingId === wing.id ? (
              <div className="space-y-3 border-b border-border px-4 py-4">
                <p className="text-sm font-semibold">Edit wing</p>
                <input
                  value={editWingName}
                  onChange={(e) => setEditWingName(e.target.value)}
                  className="admin-input"
                  placeholder="Wing name"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingWing}
                    onClick={() => saveWing(wing.id)}
                    className="voter-btn-primary px-4 py-2 text-base"
                  >
                    {savingWing ? <ButtonLoading label="Saving" /> : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditWing}
                    className="voter-btn-secondary px-4 py-2 text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleWing(wing.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      expandedWings.has(wing.id) && "rotate-90",
                    )}
                  />
                  <span className="truncate text-lg font-semibold">
                    {wing.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {wing.positions.length} position(s)
                  </span>
                </button>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => startEditWing(wing)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn-danger"
                    onClick={() => handleDeleteWing(wing)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {expandedWings.has(wing.id) && editingWingId !== wing.id && (
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
                    {editingPositionId === position.id ? (
                      <div className="space-y-3 px-3 py-3">
                        <p className="text-sm font-semibold">Edit position</p>
                        <input
                          value={editPositionTitle}
                          onChange={(e) => setEditPositionTitle(e.target.value)}
                          className="admin-input"
                          placeholder="Position title"
                        />
                        <div>
                          <label
                            htmlFor={`max-selections-${position.id}`}
                            className="mb-2 block text-sm font-semibold"
                          >
                            Selections per voter
                          </label>
                          <AdminSelect
                            id={`max-selections-${position.id}`}
                            value={String(editPositionMaxSelections)}
                            onChange={(value) =>
                              setEditPositionMaxSelections(Number(value))
                            }
                            options={[
                              { value: "1", label: "1 (pick one)" },
                              { value: "2", label: "2 (pick two)" },
                              { value: "3", label: "3 (pick three)" },
                              { value: "4", label: "4 (pick four — UN-OFFICIO)" },
                              { value: "5", label: "5 (pick five)" },
                            ]}
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Use 4 for UN-OFFICIO positions where voters choose
                            four winners from the list.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={savingPosition}
                            onClick={() => savePosition(position.id)}
                            className="voter-btn-primary px-4 py-2 text-base"
                          >
                            {savingPosition ? (
                              <ButtonLoading label="Saving" />
                            ) : (
                              "Save"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPosition}
                            className="voter-btn-secondary px-4 py-2 text-base"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => togglePosition(position.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform duration-200",
                              expandedPositions.has(position.id) && "rotate-90",
                            )}
                          />
                          <span className="truncate font-medium">
                            {position.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {position.candidates.length} candidate(s)
                            {(position.maxSelections ?? 1) > 1
                              ? ` · pick ${position.maxSelections}`
                              : ""}
                          </span>
                        </button>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="admin-action-btn"
                            onClick={() => startEditPosition(position, wing.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn-danger"
                            onClick={() => handleDeletePosition(position)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {expandedPositions.has(position.id) &&
                      editingPositionId !== position.id && (
                        <div className="space-y-3 border-t px-3 py-3">
                          {position.candidates.length === 0 &&
                            addingCandidateFor !== position.id && (
                              <p className="text-sm text-muted-foreground">
                                No candidates yet for this position.
                              </p>
                            )}

                          {position.candidates.map((candidate) =>
                            editingCandidate === candidate.id ? (
                              <div key={candidate.id}>
                                {renderCandidateForm(position.id, "edit")}
                              </div>
                            ) : (
                              <div
                                key={candidate.id}
                                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start"
                              >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                  {candidate.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={candidate.photoUrl}
                                      alt=""
                                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                      {candidate.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium">{candidate.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {candidate.status} · {candidate.voteCount}{" "}
                                      votes
                                    </p>
                                    {candidate.bio && (
                                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {candidate.bio}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="admin-action-btn"
                                    onClick={() => copyTrackingLink(candidate)}
                                  >
                                    <Link2 className="h-3.5 w-3.5" />
                                    Copy link
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-action-btn"
                                    onClick={() =>
                                      startEditCandidate(
                                        candidate,
                                        wing.id,
                                        position.id,
                                      )
                                    }
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-action-btn-danger"
                                    onClick={() =>
                                      handleDeleteCandidate(candidate)
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ),
                          )}

                          {addingCandidateFor === position.id ? (
                            renderCandidateForm(position.id, "add")
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                startAddCandidate(position.id, wing.id)
                              }
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
