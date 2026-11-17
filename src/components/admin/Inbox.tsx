"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button, StatusBanner } from "./FormFields";
import type { ContactMessage } from "@/lib/types";

/**
 * Contact-form inbox.
 *
 * Messages arrive newest-first. Selecting one marks it read, which drives the
 * unread badge on the dashboard tabs. Deleting asks for confirmation because
 * the action is irreversible.
 */
export default function Inbox({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialMessages[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  const selected = messages.find((item) => item.id === selectedId) ?? null;
  const unreadCount = messages.filter((item) => !item.isRead).length;

  /** Marks a message read (or unread) and updates local state to match. */
  async function setRead(id: number, isRead: boolean) {
    setMessages((previous) =>
      previous.map((item) => (item.id === id ? { ...item, isRead } : item)),
    );
    try {
      await api.patch(`/api/admin/messages/${id}`, { isRead });
    } catch (error) {
      // Revert the optimistic flip if the server rejected it.
      setMessages((previous) =>
        previous.map((item) => (item.id === id ? { ...item, isRead: !isRead } : item)),
      );
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Update failed.",
      });
    }
  }

  /** Opens a message and marks it read in one step. */
  function open(item: ContactMessage) {
    setSelectedId(item.id);
    if (!item.isRead) void setRead(item.id, true);
  }

  async function remove(item: ContactMessage) {
    if (!window.confirm(`Delete the message from ${item.name}? This cannot be undone.`)) {
      return;
    }

    setBusy(true);
    try {
      await api.delete(`/api/admin/messages/${item.id}`);
      const remaining = messages.filter((entry) => entry.id !== item.id);
      setMessages(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setMessage({ tone: "success", text: "Message deleted." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof ApiError ? error.message : "Delete failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (messages.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-subtle p-10 text-center text-sm text-muted">
        No messages yet. Enquiries sent through the contact form will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-secondary">
          {messages.length} message{messages.length === 1 ? "" : "s"}
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--accent)]">
              {unreadCount} unread
            </span>
          )}
        </p>
      </div>

      {message && <StatusBanner tone={message.tone}>{message.text}</StatusBanner>}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Message list */}
        <ul className="surface-card max-h-[32rem] divide-y divide-[var(--border-subtle)] overflow-y-auto rounded-2xl">
          {messages.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => open(item)}
                className={`w-full px-4 py-3.5 text-left transition-colors duration-200 hover:bg-[var(--surface-sunken)] ${
                  item.id === selectedId ? "bg-[var(--surface-sunken)]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {!item.isRead && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                      aria-label="Unread"
                    />
                  )}
                  <span
                    className={`truncate text-sm ${item.isRead ? "font-medium" : "font-semibold"}`}
                  >
                    {item.name}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted">
                  {item.company || item.email}
                </p>
                <p className="mt-1 truncate text-xs text-secondary">
                  {item.message}
                </p>
                <p className="mt-1.5 text-[0.7rem] text-muted">
                  {formatDate(item.createdAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>

        {/* Detail pane */}
        {selected ? (
          <article className="surface-card rounded-2xl p-6">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-subtle pb-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">{selected.name}</h3>
                <p className="mt-1 text-xs text-muted">
                  {selected.company ? `${selected.company} · ` : ""}
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-[var(--accent)] transition-opacity duration-200 hover:opacity-75"
                  >
                    {selected.email}
                  </a>
                </p>
                <p className="mt-1 text-[0.7rem] text-muted">
                  Received {formatDate(selected.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRead(selected.id, !selected.isRead)}
                >
                  Mark {selected.isRead ? "unread" : "read"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() => remove(selected)}
                >
                  Delete
                </Button>
              </div>
            </header>

            {/* Preserve line breaks exactly as the sender typed them. */}
            <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-secondary">
              {selected.message}
            </p>

            <div className="mt-6 border-t border-subtle pt-5">
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: your enquiry")}`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
              >
                Reply by email
              </a>
            </div>
          </article>
        ) : (
          <div className="surface-card grid place-items-center rounded-2xl p-10 text-sm text-muted">
            Select a message to read it.
          </div>
        )}
      </div>
    </div>
  );
}

/** Formats an ISO timestamp for display, tolerating an unparseable value. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
