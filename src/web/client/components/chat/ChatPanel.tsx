import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AgentAction, ChatMessage } from "../../types";
import { Markdown } from "./Markdown";

const MSG_BASE =
  "msg max-w-[86%] rounded-[15px] px-[14px] py-[10px] text-[14.5px] leading-normal animate-[fadeup_.25s_ease_both]";

const MSG_TUTOR =
  "tutor self-start rounded-bl-[4px] border border-cy-amber-soft bg-cream " +
  "before:mb-[3px] before:block before:text-[11px] before:font-extrabold before:tracking-[0.04em] before:text-cy-amber-dark before:content-[attr(data-name)] " +
  "[&_code]:rounded-[5px] [&_code]:border [&_code]:border-line [&_code]:bg-white/75 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-ink";

const MSG_USER =
  "user self-end rounded-br-[4px] bg-brand-slate text-[#f3f8f6] " +
  "[&_code]:rounded-[5px] [&_code]:bg-white/15 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-white";

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
        <Markdown text={message.text} />
      ) : (
        <span className="whitespace-pre-wrap">{message.text}</span>
      )}
    </div>
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
  onSend,
  onAction,
  actions = [],
  placeholder,
  tutorName = "Beep",
}: {
  messages: ChatMessage[];
  /** null = idle; "" = waiting for first chunk; text = streaming reply. */
  streamingText: string | null;
  onSend: (text: string) => void;
  onAction?: (action: AgentAction) => void;
  actions?: AgentAction[];
  placeholder: string;
  tutorName?: string;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const busy = streamingText !== null;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingText]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    onSend(draft);
    setDraft("");
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
      </div>

      {actions.length > 0 && onAction && (
        <div className="actions flex gap-2 px-4 pb-1">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={busy}
              onClick={() => onAction(action)}
              className="cursor-pointer rounded-full border-[1.5px] border-cy-amber bg-cy-amber-soft px-[14px] py-[7px] text-[13.5px] font-bold text-cy-amber-dark transition-all hover:bg-cy-amber hover:text-ink active:scale-95 disabled:cursor-default disabled:opacity-50"
            >
              📋 {action.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="chat-form flex gap-2 border-t border-line px-[14px] pt-[10px] pb-[calc(12px+env(safe-area-inset-bottom))]"
        onSubmit={handleSubmit}
      >
        <input
          className="min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-code-bg px-[14px] py-[11px] text-[15px] text-ink outline-none transition-colors duration-150 focus:border-cy-amber"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={busy ? `${tutorName} is thinking…` : placeholder}
          autoComplete="off"
        />
        <button
          className="cursor-pointer rounded-xl bg-cy-amber px-[18px] text-sm font-extrabold text-ink active:scale-95 disabled:cursor-default disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          Send
        </button>
      </form>
    </>
  );
}
