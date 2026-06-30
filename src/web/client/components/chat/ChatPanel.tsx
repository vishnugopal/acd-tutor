import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import mermaid from "mermaid";
import type { AgentAction, ChatMessage } from "../../types";
import type { QueuedMessage } from "../../lib/messageQueue";
import { Markdown } from "./Markdown";
import type { AgentDiagram } from "../../../../agents/types/chunks";

const MSG_BASE =
  "msg max-w-[86%] rounded-[15px] px-[14px] py-[10px] text-[14.5px] leading-normal animate-[fadeup_.25s_ease_both]";

const MSG_TUTOR =
  "tutor self-start rounded-bl-[4px] border border-cy-amber-soft bg-cream " +
  "before:mb-[3px] before:block before:text-[11px] before:font-extrabold before:tracking-[0.04em] before:text-cy-amber-dark before:content-[attr(data-name)] " +
  "[&_code]:rounded-[5px] [&_code]:border [&_code]:border-line [&_code]:bg-white/75 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-ink";

const MSG_USER =
  "user self-end rounded-br-[4px] bg-brand-slate text-[#f3f8f6] " +
  "[&_code]:rounded-[5px] [&_code]:bg-white/15 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-white";

// A queued message: a user bubble, grayed and dashed, with a waiting hint —
// it hasn't been sent yet, the tutor is still busy with an earlier reply.
const MSG_QUEUED =
  "queued self-end rounded-br-[4px] border border-dashed border-brand-slate/40 " +
  "bg-brand-slate/15 text-ink/60 opacity-80";

/** Grayed-out bubble for a message waiting behind the in-flight reply. */
function QueuedBubble({ message }: { message: QueuedMessage }) {
  return (
    <div className={`${MSG_BASE} ${MSG_QUEUED}`} title="Waiting for the tutor…">
      <span className="whitespace-pre-wrap">{message.display}</span>
      <span className="mt-[3px] block text-[11px] font-semibold tracking-[0.03em] text-muted">
        ⏳ Waiting to send…
      </span>
    </div>
  );
}

function Message({
  message,
  tutorName,
}: {
  message: ChatMessage;
  tutorName: string;
}) {
  if (message.role === "info") {
    return (
      <div className="msg info max-w-[92%] self-center text-center text-[13px] font-semibold text-muted">
        {message.text}
      </div>
    );
  }
  if (message.role === "diagram" && message.diagram) {
    return <DiagramMessage diagram={message.diagram} />;
  }
  if (message.role === "debug") {
    return (
      <div className="msg debug max-w-[92%] self-start font-mono text-[12px] whitespace-pre-wrap text-muted animate-[fadeup_.25s_ease_both]">
        {message.text}
      </div>
    );
  }
  const isTutor = message.role === "tutor";
  return (
    <div
      className={`${MSG_BASE} ${isTutor ? MSG_TUTOR : MSG_USER}`}
      data-name={isTutor ? tutorName : undefined}
    >
      {isTutor ? (
        <Markdown text={message.text ?? ""} />
      ) : (
        <span className="whitespace-pre-wrap">{message.text}</span>
      )}
    </div>
  );
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  themeVariables: {
    primaryColor: "#fff7e0",
    primaryBorderColor: "#ffb600",
    primaryTextColor: "#1d1a10",
    lineColor: "#2f4f4f",
    secondaryColor: "#fffdf6",
    tertiaryColor: "#fff1c7",
    fontFamily: "Outfit, sans-serif",
  },
});

function DiagramMessage({ diagram }: { diagram: AgentDiagram }) {
  const [expanded, setExpanded] = useState(false);

  function openModal() {
    setExpanded(true);
  }

  function closeModal() {
    setExpanded(false);
  }

  return (
    <>
      <figure
        className="diagram-msg max-w-[92%] cursor-zoom-in self-start rounded-[8px] border border-cy-amber-soft bg-code-bg p-3 animate-[fadeup_.25s_ease_both]"
        onClick={openModal}
      >
        <DiagramCaption diagram={diagram} />
        <MermaidDiagram diagram={diagram} compact />
      </figure>
      {expanded && <DiagramModal diagram={diagram} onClose={closeModal} />}
    </>
  );
}

function DiagramCaption({ diagram }: { diagram: AgentDiagram }) {
  return (
    <figcaption className="mb-2">
      <div className="text-[12px] font-extrabold text-cy-amber-dark">
        {diagram.title}
      </div>
      <div className="text-[12.5px] text-muted">{diagram.caption}</div>
    </figcaption>
  );
}

function MermaidDiagram({
  diagram,
  compact = false,
}: {
  diagram: AgentDiagram;
  compact?: boolean;
}) {
  const rawId = useId();
  const renderId = useMemo(
    () => `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [rawId],
  );
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    mermaid
      .render(renderId, diagram.mermaid)
      .then(({ svg }) => {
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = svg;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [diagram.mermaid, renderId]);

  return error ? (
    <pre className="overflow-x-auto rounded-md border border-line bg-white/70 p-2 font-mono text-[11px] whitespace-pre text-muted">
      {diagram.mermaid}
    </pre>
  ) : (
    <div
      ref={hostRef}
      className={`diagram-svg overflow-x-auto ${compact ? "diagram-svg-compact" : "diagram-svg-expanded"}`}
      role="img"
      aria-label={diagram.altText}
    />
  );
}

function DiagramModal({
  diagram,
  onClose,
}: {
  diagram: AgentDiagram;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    createPortal(
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
        onClick={onClose}
        role="presentation"
      >
        <figure
          className="diagram-modal max-h-[90vh] w-[min(1120px,94vw)] overflow-auto rounded-[8px] border border-cy-amber bg-code-bg p-5 shadow-panel"
          onClick={stopPropagation}
        >
          <DiagramCaption diagram={diagram} />
          <MermaidDiagram diagram={diagram} />
        </figure>
      </div>,
      document.body,
    )
  );
}

function TypingIndicator({ tutorName }: { tutorName: string }) {
  const dot =
    "size-[6px] rounded-full bg-cy-amber opacity-40 animate-[typing-dot_1s_infinite]";
  return (
    <div className="typing flex items-center gap-1 self-start px-1 py-[2px] text-[13px] text-muted">
      {tutorName} is thinking <i className={dot} />{" "}
      <i className={`${dot} [animation-delay:0.18s]`} />{" "}
      <i className={`${dot} [animation-delay:0.36s]`} />
    </div>
  );
}

/**
 * Live transcript + composer. The reply currently streaming in renders as a
 * growing tutor bubble; agent action buttons (e.g. "Check my work") sit above
 * the composer like the console's InputBar actions.
 */
export function ChatPanel({
  messages,
  streamingText,
  queued = [],
  onSend,
  onAction,
  actions = [],
  placeholder,
  tutorName = "Beep",
}: {
  messages: ChatMessage[];
  /** null = idle; "" = waiting for first chunk; text = streaming reply. */
  streamingText: string | null;
  /** Messages waiting behind the in-flight reply (rendered grayed-out). */
  queued?: QueuedMessage[];
  onSend: (text: string) => void;
  onAction?: (action: AgentAction) => void;
  actions?: AgentAction[];
  placeholder: string;
  tutorName?: string;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = streamingText !== null;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingText, queued]);

  // No busy guard: a message sent mid-reply is queued, not dropped.
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  }

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [draft]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div
        className="chat flex min-h-0 flex-1 flex-col gap-[10px] overflow-y-auto px-4 pt-[6px] pb-[10px]"
        ref={listRef}
      >
        {messages.map((m) => (
          <Message key={m.id} message={m} tutorName={tutorName} />
        ))}
        {streamingText ? (
          <div className={`${MSG_BASE} ${MSG_TUTOR} streaming`} data-name={tutorName}>
            <Markdown text={streamingText} />
          </div>
        ) : null}
        {/* Shown for the whole reply, not just before the first chunk — the
            tutor often pauses mid-reply to use tools. */}
        {busy && <TypingIndicator tutorName={tutorName} />}
        {queued.map((m) => (
          <QueuedBubble key={`queued-${m.id}`} message={m} />
        ))}
      </div>

      {actions.length > 0 && onAction && (
        <div className="actions flex gap-2 px-4 pb-1">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onAction(action)}
              className="cursor-pointer rounded-full border-[1.5px] border-cy-amber bg-cy-amber-soft px-[14px] py-[7px] text-[13.5px] font-bold text-cy-amber-dark transition-all hover:bg-cy-amber hover:text-ink active:scale-95 disabled:cursor-default disabled:opacity-50"
            >
              📋 {action.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="chat-form flex items-end gap-2 border-t border-line px-[14px] pt-[10px] pb-[calc(12px+env(safe-area-inset-bottom))]"
        onSubmit={handleSubmit}
      >
        <textarea
          ref={inputRef}
          className="max-h-36 min-h-[46px] min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border-[1.5px] border-line bg-code-bg px-[14px] py-[11px] text-[15px] leading-[1.35] whitespace-pre-wrap text-ink outline-none transition-colors duration-150 focus:border-cy-amber"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={busy ? "Send another — it'll queue…" : placeholder}
          autoComplete="off"
          rows={1}
        />
        <button
          className="min-h-[46px] cursor-pointer rounded-xl bg-cy-amber px-[18px] text-sm font-extrabold text-ink active:scale-95 disabled:cursor-default disabled:opacity-60"
          type="submit"
        >
          Send
        </button>
      </form>
    </>
  );
}
