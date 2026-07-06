"use client";

import { Download, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ButtonLoading } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import type { VoterImportValidation } from "@/lib/voter-import";

type Voter = {
  id: string;
  name: string;
  phoneNumber: string;
  memberRegistrationNumber: string;
  hasVoted: boolean;
};

type VoterForm = {
  name: string;
  phoneNumber: string;
  memberRegistrationNumber: string;
};

const emptyForm: VoterForm = {
  name: "",
  phoneNumber: "",
  memberRegistrationNumber: "",
};

function sortVoters(list: Voter[]) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

export function VotersPageClient() {
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvText, setCsvText] = useState("");
  const [validation, setValidation] = useState<VoterImportValidation | null>(
    null,
  );
  const [importing, setImporting] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<VoterForm>(emptyForm);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<VoterForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshVoters = useCallback(async () => {
    const response = await fetch("/api/admin/voters");
    const data = await response.json();
    if (response.ok) {
      setVoters(data.voters ?? []);
    }
  }, []);

  useEffect(() => {
    refreshVoters().finally(() => setLoading(false));
  }, [refreshVoters]);

  async function handleValidate() {
    const response = await fetch("/api/admin/voters/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", csv: csvText }),
    });
    const data = await response.json();
    if (!response.ok) {
      toastError(data.error ?? "Validation failed.");
      setValidation(null);
      return;
    }
    setValidation(data);
    if (data.validCount > 0) {
      success(`${data.validCount} row(s) ready to import.`);
    } else {
      toastError("No valid rows found. Check the errors below.");
    }
  }

  async function handleImport() {
    if (!validation?.validRows.length) return;
    setImporting(true);

    const response = await fetch("/api/admin/voters/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "commit", rows: validation.validRows }),
    });
    const data = await response.json();
    setImporting(false);

    if (!response.ok) {
      toastError(data.error ?? "Import failed.");
      return;
    }

    success(`Imported ${data.imported} voter(s).`);
    setValidation(null);
    setCsvText("");
    await refreshVoters();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
      setValidation(null);
    };
    reader.readAsText(file);
  }

  async function handleAddVoter(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);

    const response = await fetch("/api/admin/voters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await response.json();
    setAdding(false);

    if (!response.ok) {
      toastError(data.error ?? "Could not add voter.");
      return;
    }

    setVoters((prev) => sortVoters([...prev, data.voter]));
    success(`Added ${data.voter.name}.`);
    setAddForm(emptyForm);
    setShowAddForm(false);
  }

  function startEdit(voter: Voter) {
    setEditingId(voter.id);
    setEditForm({
      name: voter.name,
      phoneNumber: voter.phoneNumber,
      memberRegistrationNumber: voter.memberRegistrationNumber,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
  }

  async function handleSaveEdit(voter: Voter) {
    setSaving(true);

    const response = await fetch(`/api/admin/voters/${voter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      toastError(data.error ?? "Could not save changes.");
      return;
    }

    setVoters((prev) =>
      sortVoters(
        prev.map((item) => (item.id === data.voter.id ? data.voter : item)),
      ),
    );
    success(`Updated ${data.voter.name}.`);
    setEditingId(null);
  }

  async function handleDelete(voter: Voter) {
    const ok = await confirm({
      title: "Remove voter?",
      description: `${voter.name} will be permanently removed from the voter roll. This cannot be undone.`,
      confirmLabel: "Remove voter",
      cancelLabel: "Keep voter",
      variant: "destructive",
    });
    if (!ok) return;

    setDeletingId(voter.id);

    const response = await fetch(`/api/admin/voters/${voter.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    setDeletingId(null);

    if (!response.ok) {
      toastError(data.error ?? "Could not delete voter.");
      return;
    }

    setVoters((prev) => prev.filter((v) => v.id !== voter.id));
    success(`Removed ${voter.name}.`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="admin-page-title">Voters</h2>
        <p className="admin-page-desc">
          Add voters individually, edit records, or bulk-import from CSV.
        </p>
      </div>

      <section className="voter-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Bulk import</h3>
            <p className="mt-1 text-base text-muted-foreground">
              Use the template below. Required columns:{" "}
              <span className="font-mono text-sm">name</span>,{" "}
              <span className="font-mono text-sm">phoneNumber</span>,{" "}
              <span className="font-mono text-sm">registrationNumber</span>
            </p>
          </div>
          <a
            href="/api/admin/voters/template"
            className="voter-btn-secondary inline-flex items-center gap-2 px-5 py-2 text-base"
          >
            <Download className="h-4 w-4" />
            Download template
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="text-base"
          />
          <button
            type="button"
            disabled={!csvText}
            onClick={handleValidate}
            className="voter-btn-secondary px-5 py-2 text-base"
          >
            Validate CSV
          </button>
        </div>

        {validation && (
          <div className="mt-6 space-y-4">
            <div className="flex gap-4 text-base">
              <span className="admin-badge-success">
                {validation.validCount} valid
              </span>
              <span className="inline-flex rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                {validation.invalidCount} with errors
              </span>
            </div>

            {validation.rows.some((row) => row.errors.length > 0) && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.rows
                      .filter((row) => row.errors.length > 0)
                      .map((row) => (
                        <tr key={row.rowNumber}>
                          <td>{row.rowNumber}</td>
                          <td>{row.raw.name || "—"}</td>
                          <td>{row.raw.phoneNumber || "—"}</td>
                          <td className="text-destructive">
                            {row.errors.join(" ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {validation.validCount > 0 && (
              <button
                type="button"
                disabled={importing}
                onClick={handleImport}
                className="voter-btn-primary px-6 py-2 text-base"
              >
                {importing ? (
                  <ButtonLoading label="Importing" />
                ) : (
                  `Import ${validation.validCount} voter(s)`
                )}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="voter-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Add voter</h3>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="voter-btn-secondary inline-flex items-center gap-2 px-5 py-2 text-base"
            >
              <Plus className="h-4 w-4" />
              New voter
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleAddVoter} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="add-name" className="mb-2 block text-sm font-semibold">
                  Name
                </label>
                <input
                  id="add-name"
                  required
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="admin-input"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="add-phone" className="mb-2 block text-sm font-semibold">
                  Phone
                </label>
                <input
                  id="add-phone"
                  required
                  value={addForm.phoneNumber}
                  onChange={(e) =>
                    setAddForm((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="admin-input"
                  placeholder="08031234567"
                />
              </div>
              <div>
                <label htmlFor="add-reg" className="mb-2 block text-sm font-semibold">
                  Registration #
                </label>
                <input
                  id="add-reg"
                  required
                  value={addForm.memberRegistrationNumber}
                  onChange={(e) =>
                    setAddForm((prev) => ({
                      ...prev,
                      memberRegistrationNumber: e.target.value,
                    }))
                  }
                  className="admin-input"
                  placeholder="NIESV-001"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={adding}
                className="voter-btn-primary px-6 py-2 text-base"
              >
                {adding ? <ButtonLoading label="Adding" /> : "Add voter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddForm(emptyForm);
                }}
                className="voter-btn-secondary px-5 py-2 text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="voter-card p-0">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">
            All voters ({loading ? "…" : voters.length})
          </h3>
        </div>
        <div className="admin-table-wrap rounded-none border-0 shadow-none">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Registration #</th>
                <th>Status</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="py-3">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))
              ) : voters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No voters yet. Download the template or add a voter to get
                    started.
                  </td>
                </tr>
              ) : (
                voters.map((voter) =>
                  editingId === voter.id ? (
                    <tr key={voter.id} className="bg-secondary/30">
                      <td>
                        <input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="admin-input"
                        />
                      </td>
                      <td>
                        <input
                          value={editForm.phoneNumber}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              phoneNumber: e.target.value,
                            }))
                          }
                          disabled={voter.hasVoted}
                          title={
                            voter.hasVoted
                              ? "Phone cannot be changed after voting"
                              : undefined
                          }
                          className="admin-input font-mono text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </td>
                      <td>
                        <input
                          value={editForm.memberRegistrationNumber}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              memberRegistrationNumber: e.target.value,
                            }))
                          }
                          className="admin-input"
                        />
                      </td>
                      <td>
                        <span
                          className={
                            voter.hasVoted
                              ? "admin-badge-success"
                              : "admin-badge-muted"
                          }
                        >
                          {voter.hasVoted ? "Voted" : "Not voted"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleSaveEdit(voter)}
                            className="rounded-lg border-2 border-primary bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                          >
                            {saving ? "…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border-2 border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                            aria-label="Cancel edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={voter.id}>
                      <td>{voter.name}</td>
                      <td className="font-mono text-sm">{voter.phoneNumber}</td>
                      <td>{voter.memberRegistrationNumber}</td>
                      <td>
                        <span
                          className={
                            voter.hasVoted
                              ? "admin-badge-success"
                              : "admin-badge-muted"
                          }
                        >
                          {voter.hasVoted ? "Voted" : "Not voted"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(voter)}
                            className="rounded-lg border-2 border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Edit ${voter.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {!voter.hasVoted && (
                            <button
                              type="button"
                              disabled={deletingId === voter.id}
                              onClick={() => handleDelete(voter)}
                              className="rounded-lg border-2 border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                              aria-label={`Delete ${voter.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
