"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

interface ConversationRenameRowProps {
  conversationId: string;
  initialTitle: string;
  onSave: (id: string, title: string) => void;
  onCancel: () => void;
}

export const ConversationRenameRow = React.memo(function ConversationRenameRow({
  conversationId,
  initialTitle,
  onSave,
  onCancel,
}: ConversationRenameRowProps) {
  const [value, setValue] = React.useState(initialTitle);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Lifecycle: mount / unmount
  React.useEffect(() => {
    console.debug("[Rename] mount", { conversationId, initialTitle });
    return () => {
      console.debug("[Rename] unmount", { conversationId });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only

  // Lifecycle: rerender (every render after mount)
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current > 1) {
    console.debug("[Rename] rerender", { conversationId, value, renderCount: renderCountRef.current });
  }

  // Auto-focus and select-all on mount — no autoFocus prop so the
  // browser doesn't scroll/zoom on mobile when the element is inserted.
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.select();
  }, []); // mount-only

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    console.debug("[Rename] save", { conversationId, title: trimmed });
    onSave(conversationId, trimmed);
  };

  const handleCancel = () => {
    console.debug("[Rename] cancel", { conversationId });
    onCancel();
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 mx-2 mb-2"
      style={{ background: "rgba(255,255,255,0.05)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
          }
        }}
        // No onBlur save — cancel/save are explicit only (Enter, Escape, buttons)
        className="flex-1 min-w-0 bg-transparent text-xs text-white outline-none"
        style={{
          borderBottom: "1px solid rgba(212,165,116,0.5)",
          paddingBottom: "2px",
        }}
        aria-label="Rename conversation"
      />
      <button
        onMouseDown={(e) => {
          e.preventDefault(); // prevent blur before save
          handleSave();
        }}
        className="grid place-items-center size-5 rounded shrink-0"
        style={{ color: "#d4a574" }}
        aria-label="Save rename"
      >
        <Check size={11} />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault(); // prevent blur before cancel
          handleCancel();
        }}
        className="grid place-items-center size-5 rounded shrink-0"
        style={{ color: "rgba(255,255,255,0.4)" }}
        aria-label="Cancel rename"
      >
        <X size={11} />
      </button>
    </div>
  );
});
