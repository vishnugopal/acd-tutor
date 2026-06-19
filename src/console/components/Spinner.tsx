import { Text } from "ink";
import { useEffect, useState } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const FRAME_MS = 80;

/** Animated braille spinner with a dim label, e.g. while the agent is busy. */
export function Spinner({ label }: { label: string }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setFrame((prev) => (prev + 1) % FRAMES.length),
      FRAME_MS,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <Text>
      <Text color="cyan">{FRAMES[frame]}</Text>
      <Text dimColor> {label}</Text>
    </Text>
  );
}
