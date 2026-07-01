import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "../../../src/web/client/components/chat/Markdown";

/**
 * Renders the tutor markdown to a static HTML string (no DOM needed) and
 * asserts on the shape — enough to pin the token-walk without a browser.
 */
const html = (text: string) => renderToStaticMarkup(<Markdown text={text} />);

describe("Markdown tables (GFM)", () => {
  const TABLE = [
    "| # | Insight |",
    "|---|---------|",
    "| 1 | Code speaks at different levels |",
    "| 2 | A call graph makes levels visible |",
  ].join("\n");

  test("renders a real <table> instead of raw pipes", () => {
    const out = html(TABLE);
    expect(out).toContain("<table>");
    expect(out).toContain("<thead>");
    expect(out).toContain("<th");
    expect(out).toContain("<td");
    // The header and a body cell survived the walk…
    expect(out).toContain("Insight");
    expect(out).toContain("A call graph makes levels visible");
    // …and the delimiter row never leaks through as text.
    expect(out).not.toContain("---");
  });

  test("honors column alignment", () => {
    const aligned = [
      "| L | C | R |",
      "|:--|:-:|--:|",
      "| a | b | c |",
    ].join("\n");
    const out = html(aligned);
    expect(out).toContain("text-align:center");
    expect(out).toContain("text-align:right");
  });
});

describe("Markdown basics still render", () => {
  test("bold and inline code", () => {
    const out = html("Use **bold** and `code` here.");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<code>code</code>");
  });
});
