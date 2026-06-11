import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "../../types";

const TUTOR_NAME = "Beep";

const MSG_BASE =
  "msg max-w-[86%] rounded-[15px] px-[14px] py-[10px] text-[14.5px] leading-normal animate-[fadeup_.25s_ease_both]";

const MSG_TUTOR =
  "tutor self-start rounded-bl-[4px] border border-cy-amber-soft bg-cream " +
  "before:mb-[3px] before:block before:text-[11px] before:font-extrabold before:tracking-[0.04em] before:text-cy-amber-dark before:content-[attr(data-name)] " +
  "[&_code]:rounded-[5px] [&_code]:border [&_code]:border-line [&_code]:bg-white/75 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-ink";

const MSG_USER =
  "user self-end rounded-br-[4px] bg-brand-slate text-[#f3f8f6] " +
  "[&_code]:rounded-[5px] [&_code]:bg-white/15 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-white";

/** Renders `code` spans for backtick-quoted fragments in tutor copy. */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <code key={i}>{part}</code> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.kind === "diagram") {
    return (
      <div className="msg diagram max-w-none self-stretch overflow-x-auto rounded-xl border border-dashed border-cy-amber bg-code-bg p-3 font-mono text-[11.5px] leading-[1.55] whitespace-pre text-cy-blue animate-[fadeup_.25s_ease_both]">
        {message.text}
      </div>
    );
  }
  const roleClasses = message.role === "tutor" ? MSG_TUTOR : MSG_USER;
  return (
    <div
      className={`${MSG_BASE} ${roleClasses}`}
      data-name={message.role === "tutor" ? TUTOR_NAME : undefined}
    >
      <MessageText text={message.text} />
    </div>
  );
}

function TypingIndicator() {
  const dot =
    "size-[6px] rounded-full bg-cy-amber opacity-40 animate-[typing-dot_1s_infinite]";
  return (
    <div className="typing flex items-center gap-1 self-start px-1 py-[2px] text-[13px] text-muted">
      {TUTOR_NAME} is thinking <i className={dot} />{" "}
      <i className={`${dot} [animation-delay:0.18s]`} />{" "}
      <i className={`${dot} [animation-delay:0.36s]`} />
    </div>
  );
}

/**
 * Message list + composer. Scrolls to the newest message itself; everything
 * else (script logic, delays) lives in useScriptedChat.
 */
export function ChatPanel({
  messages,
  isTyping,
  onSend,
  placeholder,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || isTyping) return;
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
          <Message key={m.id} message={m} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
      <form
        className="chat-form flex gap-2 border-t border-line px-[14px] pt-[10px] pb-[calc(12px+env(safe-area-inset-bottom))]"
        onSubmit={handleSubmit}
      >
        <input
          className="min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-code-bg px-[14px] py-[11px] text-[15px] text-ink outline-none transition-colors duration-150 focus:border-cy-amber"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          className="cursor-pointer rounded-xl bg-cy-amber px-[18px] text-sm font-extrabold text-ink active:scale-95"
          type="submit"
        >
          Send
        </button>
      </form>
    </>
  );
}
