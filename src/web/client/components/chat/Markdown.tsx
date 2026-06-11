import { Lexer, type Token, type Tokens } from "marked";
import { Fragment, useMemo, type ReactNode } from "react";

/**
 * Renders the tutor's markdown as React elements by walking marked's token
 * tree — no dangerouslySetInnerHTML, so model output can't inject markup.
 * Covers what tutors actually produce (bold/italic, inline code, fenced
 * blocks, lists, headings, links, blockquotes); anything unrecognized falls
 * back to its raw text. Block spacing/sizing lives in global.css under `.md`.
 */

function children(tokens: Token[] | undefined): ReactNode {
  if (!tokens) return null;
  return tokens.map((token, i) => (
    <Fragment key={i}>{renderToken(token)}</Fragment>
  ));
}

function renderToken(token: Token): ReactNode {
  switch (token.type) {
    case "paragraph":
      return <p>{children(token.tokens)}</p>;
    case "strong":
      return <strong>{children(token.tokens)}</strong>;
    case "em":
      return <em>{children(token.tokens)}</em>;
    case "del":
      return <del>{children(token.tokens)}</del>;
    case "codespan":
      return <code>{(token as Tokens.Codespan).text}</code>;
    case "code":
      // Fenced blocks double as the tutor's ASCII/Mermaid diagrams.
      return (
        <pre className="my-2 overflow-x-auto rounded-xl border border-dashed border-cy-amber bg-code-bg p-3 font-mono text-[11.5px] leading-[1.55] whitespace-pre text-cy-blue">
          {(token as Tokens.Code).text}
        </pre>
      );
    case "heading": {
      const depth = (token as Tokens.Heading).depth;
      const Tag = (depth <= 3 ? `h${depth + 3}` : "h6") as "h4" | "h5" | "h6";
      return <Tag>{children(token.tokens)}</Tag>;
    }
    case "list": {
      const list = token as Tokens.List;
      const items = list.items.map((item, i) => (
        <li key={i}>{children(item.tokens)}</li>
      ));
      return list.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "blockquote":
      return <blockquote>{children(token.tokens)}</blockquote>;
    case "link":
      return (
        <a
          href={(token as Tokens.Link).href}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-cy-blue underline"
        >
          {children(token.tokens)}
        </a>
      );
    case "br":
      return <br />;
    case "hr":
      return <hr />;
    case "space":
      return null;
    case "text": {
      const text = token as Tokens.Text;
      return text.tokens ? children(text.tokens) : text.text;
    }
    case "escape":
      return (token as Tokens.Escape).text;
    default:
      return "raw" in token ? (token.raw as string) : null;
  }
}

export function Markdown({ text }: { text: string }) {
  const tokens = useMemo(
    () => Lexer.lex(text, { gfm: true, breaks: true }),
    [text],
  );
  return <div className="md">{children(tokens)}</div>;
}
