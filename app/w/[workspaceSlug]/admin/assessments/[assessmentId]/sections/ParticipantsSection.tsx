"use client";

import Link from "next/link";
import { CandidateRecord } from "./types";

interface ParticipantsSectionProps {
  workspaceSlug: string;
  candidates: CandidateRecord[];
  filteredAvailableUsers: CandidateRecord[];
  showAssignDropdown: boolean;
  setShowAssignDropdown: (val: boolean) => void;
  handleAssignCandidate: (userId: string) => void;
  handleRemoveCandidate: (userId: string) => void;
}

export default function ParticipantsSection({
  workspaceSlug,
  candidates,
  filteredAvailableUsers,
  showAssignDropdown,
  setShowAssignDropdown,
  handleAssignCandidate,
  handleRemoveCandidate,
}: ParticipantsSectionProps) {
  return (
    <div id="participants" className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-participants">Teilnehmer</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/w/${workspaceSlug}/admin/users`}
            className="rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
            data-testid="link-manage-users"
          >
            Benutzer verwalten
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
              data-testid="button-assign-candidate"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
            >
              Teilnehmer zuweisen
            </button>
            {showAssignDropdown && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-[var(--eds-border)] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {filteredAvailableUsers.length === 0 ? (
                  <p className="p-3 text-sm text-[var(--eds-text-disabled)]">Keine verfügbaren Benutzer.</p>
                ) : (
                  filteredAvailableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAssignCandidate(user.id)}
                      data-testid={`button-assign-user-${user.id}`}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)] last:border-b-0"
                    >
                      <p className="text-sm font-medium text-[var(--eds-text-primary)]">{user.name}</p>
                      <p className="text-xs text-[var(--eds-text-tertiary)]">{user.email}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="flex items-center justify-between border border-[var(--eds-border)] rounded-lg px-4 py-3"
            data-testid={`row-candidate-${candidate.id}`}
          >
            <div>
              <p className="text-sm font-medium text-[var(--eds-text-primary)]">{candidate.name}</p>
              <p className="text-xs text-[var(--eds-text-tertiary)]">{candidate.email}</p>
            </div>
            <button
              onClick={() => handleRemoveCandidate(candidate.id)}
              data-testid={`button-remove-candidate-${candidate.id}`}
              className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] font-medium"
            >
              Entfernen
            </button>
          </div>
        ))}
        {candidates.length === 0 && (
          <p className="text-sm text-[var(--eds-text-disabled)] text-center py-6">Keine Teilnehmer zugewiesen.</p>
        )}
      </div>
    </div>
  );
}
