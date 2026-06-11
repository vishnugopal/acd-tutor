/**
 * The only thing persisted client-side is the conversation (instance) id per
 * agent — history itself is fetched back from the server (Flue's snapshot),
 * never duplicated in localStorage.
 */

const key = (agentId: string) => `codebuddy:${agentId}:conversation`;

export function loadConversationId(agentId: string): string | null {
  try {
    return localStorage.getItem(key(agentId));
  } catch {
    return null;
  }
}

export function saveConversationId(agentId: string, id: string): void {
  try {
    localStorage.setItem(key(agentId), id);
  } catch {
    // private mode / storage disabled — conversation just won't survive reloads
  }
}

export function clearConversationId(agentId: string): void {
  try {
    localStorage.removeItem(key(agentId));
  } catch {
    // ignore
  }
}
