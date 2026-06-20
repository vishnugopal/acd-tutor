import { defineTool, type ToolDefinition } from "@flue/runtime";
import { rm } from "node:fs/promises";
import type { AgentDiagram } from "../types/chunks";

const MAX_MERMAID_SOURCE = 5_000;
const DIAGRAM_TOOL_RESULT = "mermaid-diagram";

export interface MermaidDiagramToolResult {
  type: typeof DIAGRAM_TOOL_RESULT;
  diagram: AgentDiagram;
}

export interface MermaidDiagramToolOptions {
  renderer?: string;
}

interface DiagramArgs {
  title: string;
  caption: string;
  altText: string;
  mermaid: string;
}

const allowedStart = /^(flowchart\s+(TD|TB|BT|RL|LR)|graph\s+(TD|TB|BT|RL|LR)|sequenceDiagram)\b/;
const forbidden = [
  /%%\{/,
  /<\/?[a-z][^>]*>/i,
  /\bclick\b/i,
  /\bhref\b/i,
  /\bjavascript:/i,
  /\bcallback\b/i,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function validateMermaidSource(source: string): string | null {
  const trimmed = source.trim();
  if (trimmed.length === 0) return "Mermaid source is empty";
  if (trimmed.length > MAX_MERMAID_SOURCE) return "Mermaid source is too large";
  if (!allowedStart.test(trimmed)) {
    return "Only flowchart, graph, and sequenceDiagram diagrams are supported";
  }
  for (const pattern of forbidden) {
    if (pattern.test(trimmed)) {
      return "Mermaid source uses unsupported interactive or HTML syntax";
    }
  }
  return null;
}

function isDiagramArgs(value: unknown): value is DiagramArgs {
  return (
    isRecord(value) &&
    isString(value.title) &&
    isString(value.caption) &&
    isString(value.altText) &&
    isString(value.mermaid)
  );
}

async function runMermkit(
  source: string,
  format: "term" | "ascii",
  renderer: string,
): Promise<string | null> {
  const id = crypto.randomUUID();
  const input = `/tmp/mermkit-${id}.mmd`;
  await Bun.write(input, source);
  try {
    const command =
      renderer === "bunx"
        ? ["bunx", "--bun", "mermkit"]
        : [renderer];
    const args =
      format === "term"
        ? [...command, "term", "--in", input]
        : [...command, "render", "--in", input, "--format", "ascii"];
    const proc = Bun.spawn(args, {
      stdout: "pipe",
      stderr: "ignore",
    });
    if ((await proc.exited) !== 0) return null;
    return await new Response(proc.stdout).text();
  } catch {
    return null;
  } finally {
    await rm(input, { force: true });
  }
}

export function isMermaidDiagramToolResult(
  value: unknown,
): value is MermaidDiagramToolResult {
  return (
    isRecord(value) &&
    value.type === DIAGRAM_TOOL_RESULT &&
    isRecord(value.diagram) &&
    isString(value.diagram.title) &&
    isString(value.diagram.caption) &&
    isString(value.diagram.altText) &&
    isString(value.diagram.mermaid)
  );
}

export function parseMermaidDiagramToolResult(
  value: unknown,
): MermaidDiagramToolResult | null {
  if (isRecord(value) && Array.isArray(value.content)) {
    for (const item of value.content) {
      if (isRecord(item) && item.type === "text" && isString(item.text)) {
        const parsed = parseMermaidDiagramToolResult(item.text);
        if (parsed !== null) return parsed;
      }
    }
  }
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;
  return isMermaidDiagramToolResult(parsed) ? parsed : null;
}

/**
 * Model-callable Mermaid diagram tool. Validation is a calculation over the
 * source; rendering is the action boundary that optionally calls mermkit.
 */
export function createMermaidDiagramTools(
  opts: MermaidDiagramToolOptions = {},
): ToolDefinition[] {
  const renderer = opts.renderer ?? process.env.MERMKIT_BIN ?? "bunx";

  return [
    defineTool({
      name: "showDiagram",
      description:
        "Render a Mermaid diagram for the learner. Use this only for function-level call graphs, level boundaries, or sequence relationships that clarify stratified design.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short diagram title" },
          caption: {
            type: "string",
            description: "One-sentence caption explaining what to notice",
          },
          altText: {
            type: "string",
            description: "Accessible description of the diagram",
          },
          mermaid: {
            type: "string",
            description:
              "Mermaid source. Use flowchart/graph for function levels and sequenceDiagram for call sequences.",
          },
        },
        required: ["title", "caption", "altText", "mermaid"],
      },
      execute: async (args) => {
        if (!isDiagramArgs(args)) {
          throw new Error("Invalid diagram arguments");
        }
        const error = validateMermaidSource(args.mermaid);
        if (error !== null) throw new Error(error);
        const [terminal, ascii] = await Promise.all([
          runMermkit(args.mermaid, "term", renderer),
          runMermkit(args.mermaid, "ascii", renderer),
        ]);
        return JSON.stringify({
          type: DIAGRAM_TOOL_RESULT,
          diagram: {
            title: args.title.trim(),
            caption: args.caption.trim(),
            altText: args.altText.trim(),
            mermaid: args.mermaid.trim(),
            terminal: terminal?.trim() || ascii?.trim() || args.mermaid.trim(),
          },
        } satisfies MermaidDiagramToolResult);
      },
    }),
  ];
}

export const __test__ =
  process.env.NODE_ENV === "test"
    ? {
        escapeXml,
        validateMermaidSource,
        isMermaidDiagramToolResult,
        parseMermaidDiagramToolResult,
      }
    : undefined;
