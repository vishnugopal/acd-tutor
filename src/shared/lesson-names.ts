/**
 * Pure calculations over lesson filenames (lesson-1.ts … lesson-7.ts),
 * shared by the browser (tabs, dashboard progress) and the host (lesson-file
 * listing). Layer 0: no I/O — callers pass the names in.
 */

/** Dotfiles are host bookkeeping (e.g. the open-request signal), not lessons. */
export function isHiddenFile(name: string): boolean {
  return name.startsWith(".");
}

export function lessonNumber(name: string): number | null {
  const match = name.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

/** Numbered lesson files in numeric order, then anything else alphabetically. */
export function sortLessonFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const na = lessonNumber(a);
    const nb = lessonNumber(b);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return a.localeCompare(b);
  });
}

/** The most advanced lesson file — what the student is working on now. */
export function latestLessonFile(files: string[]): string | null {
  const sorted = sortLessonFiles(files);
  return sorted.length > 0 ? (sorted[sorted.length - 1] ?? null) : null;
}

/**
 * Course progress derived from which lesson files the tutor has created:
 * the highest-numbered file is the current lesson, everything below is done.
 */
export function courseProgress(files: string[]): {
  current: number;
  done: number[];
} {
  const numbers = files
    .map(lessonNumber)
    .filter((n): n is number => n !== null);
  if (numbers.length === 0) return { current: 1, done: [] };
  const current = Math.max(...numbers);
  return {
    current,
    done: Array.from({ length: current - 1 }, (_, i) => i + 1),
  };
}
