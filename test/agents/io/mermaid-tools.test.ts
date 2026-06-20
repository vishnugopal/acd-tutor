import { describe, expect, test } from "bun:test";
import { __test__ } from "../../../src/agents/io/mermaid-tools";

const {
  isMermaidDiagramToolResult,
  parseMermaidDiagramToolResult,
  validateMermaidSource,
} = __test__!;

describe("validateMermaidSource", () => {
  test("accepts supported diagram types", () => {
    expect(validateMermaidSource("flowchart TD\n  A --> B")).toBeNull();
    expect(validateMermaidSource("graph LR\n  A --> B")).toBeNull();
    expect(validateMermaidSource("sequenceDiagram\n  A->>B: call")).toBeNull();
  });

  test("rejects unsupported and unsafe syntax", () => {
    expect(validateMermaidSource("classDiagram\n  A <|-- B")).toContain(
      "Only flowchart",
    );
    expect(validateMermaidSource("flowchart TD\n  A[<b>x</b>]")).toContain(
      "unsupported",
    );
    expect(validateMermaidSource("flowchart TD\n  click A href \"https://x\"")).toContain(
      "unsupported",
    );
    expect(validateMermaidSource("%%{init:{}}%%\nflowchart TD\n  A --> B")).toContain(
      "Only flowchart",
    );
  });

  test("rejects empty and oversized source", () => {
    expect(validateMermaidSource("   ")).toBe("Mermaid source is empty");
    expect(validateMermaidSource(`flowchart TD\n${"A-->B\n".repeat(1000)}`)).toBe(
      "Mermaid source is too large",
    );
  });
});

describe("isMermaidDiagramToolResult", () => {
  test("accepts the marker object shape", () => {
    expect(
      isMermaidDiagramToolResult({
        type: "mermaid-diagram",
        diagram: {
          title: "Levels",
          caption: "Top calls domain.",
          altText: "A top-level function calls a domain helper.",
          mermaid: "flowchart TD\n  A --> B",
        },
      }),
    ).toBe(true);
  });

  test("rejects partial objects", () => {
    expect(isMermaidDiagramToolResult({ type: "mermaid-diagram" })).toBe(false);
    expect(
      isMermaidDiagramToolResult({
        type: "other",
        diagram: {
          title: "Levels",
          caption: "Top calls domain.",
          altText: "A top-level function calls a domain helper.",
          mermaid: "flowchart TD\n  A --> B",
        },
      }),
    ).toBe(false);
  });
});

describe("parseMermaidDiagramToolResult", () => {
  const result = {
    type: "mermaid-diagram",
    diagram: {
      title: "Levels",
      caption: "Top calls domain.",
      altText: "A top-level function calls a domain helper.",
      mermaid: "flowchart TD\n  A --> B",
    },
  } as const;

  test("parses raw JSON tool result text", () => {
    expect(parseMermaidDiagramToolResult(JSON.stringify(result))).toEqual(result);
  });

  test("parses Flue content-array wrapped tool results", () => {
    expect(
      parseMermaidDiagramToolResult({
        content: [{ type: "text", text: JSON.stringify(result) }],
      }),
    ).toEqual(result);
  });

  test("returns null for unrelated tool output", () => {
    expect(parseMermaidDiagramToolResult({ content: [{ type: "text", text: "ok" }] })).toBeNull();
  });
});
