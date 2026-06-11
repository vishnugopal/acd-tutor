import { AppBar } from "../components/AppBar";
import { CodeBuddyLogo } from "../components/CodeBuddyLogo";
import { Mascot } from "../components/Mascot";
import { ACD_LESSON } from "../data/acdLesson";
import { COURSE_STEPS } from "../data/course";
import { useGameState } from "../state/GameStateContext";
import type { Screen } from "../types";

const CARD =
  "lesson-card group relative cursor-pointer overflow-hidden rounded-[18px] border border-line bg-white p-5 text-left shadow-panel transition-all duration-[160ms] hover:-translate-y-[3px] hover:border-cy-amber hover:shadow-[0_2px_4px_rgba(61,48,6,0.06),0_14px_34px_rgba(61,48,6,0.13)] active:scale-[0.985]";

const NODE_BASE =
  "node relative z-[1] mx-auto grid size-[42px] place-items-center rounded-xl border-[1.5px] font-mono text-xs font-bold " +
  "before:absolute before:-top-[7px] before:-right-[7px] before:rounded-[5px] before:border before:border-line before:bg-cy-amber-soft before:px-1 before:text-[8px] before:text-muted before:content-['ts']";

const NODE_BY_STATE = {
  done: "border-cy-amber bg-cy-amber-soft text-cy-amber-dark",
  cur: "border-cy-amber bg-cy-amber text-ink shadow-[0_0_0_5px_rgba(255,182,0,0.22)] animate-[nodepulse_2s_ease_infinite]",
  lock: "border-line bg-code-bg text-muted opacity-55",
};

function CourseStepper() {
  const { completedLessons } = useGameState();
  const current = Math.max(...completedLessons, 0) + 1;

  return (
    <div className="stepper-card rounded-[18px] border border-line bg-white p-[18px] shadow-panel">
      <h3 className="mb-[14px] text-[13px] font-bold tracking-[0.1em] text-muted uppercase">
        Actions · Calculations · Data — course
      </h3>
      <div className="stepper flex items-start overflow-x-auto pb-[6px]">
        {COURSE_STEPS.map((step) => {
          const done = completedLessons.includes(step.number);
          const state = done ? "done" : step.number === current ? "cur" : "lock";
          return (
            <div
              key={step.number}
              className={`step ${state} relative w-[76px] flex-none text-center after:absolute after:top-[21px] after:left-[calc(50%+24px)] after:h-[2px] after:w-[calc(100%-48px)] after:content-[''] last:after:hidden ${
                done ? "after:bg-cy-amber" : "after:bg-line"
              }`}
            >
              <div className={`${NODE_BASE} ${NODE_BY_STATE[state]}`}>
                {done ? "✓" : `L${step.number}`}
              </div>
              <div
                className={`slabel mt-[7px] text-[11.5px] leading-[1.25] ${
                  state === "cur" ? "font-bold text-cy-amber-dark" : "text-muted"
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { streak, completedLessons } = useGameState();
  const lesson3Done = completedLessons.includes(3);

  return (
    <section className="screen flex flex-1 flex-col animate-[fadeup_.4s_ease_both]">
      <AppBar brand={<CodeBuddyLogo />} />

      <div className="home-body mx-auto flex w-full max-w-[760px] flex-col gap-[22px] px-5 pt-[26px] pb-[60px]">
        <div className="hero-row flex items-center gap-4">
          <Mascot
            mood={lesson3Done ? "cheer" : "idle"}
            className="h-[84px] w-[90px]"
          />
          <div className="hero-bubble rounded-2xl rounded-bl-[4px] border border-line bg-white px-4 py-[10px] text-[15px] shadow-panel animate-[fadeup_.5s_ease_.15s_both]">
            {lesson3Done
              ? "Clean build on lesson 3! 🎉 Lesson 4 is unlocked."
              : "Hey! Lesson 3 is open — those sneaky lines won't find themselves. 🔍"}
          </div>
        </div>

        <div className="hello">
          <h1 className="text-[clamp(26px,5vw,34px)] font-extrabold tracking-[-0.02em]">
            Morning, <em className="text-cy-amber-dark not-italic">coder</em>.
          </h1>
          <p className="mt-1 text-[15.5px] text-muted">
            Day {streak} of your streak. Keep the build green.
          </p>
        </div>

        <CourseStepper />

        <div className="cards grid grid-cols-1 gap-[14px] min-[720px]:grid-cols-2">
          <button className={`${CARD} acd`} onClick={() => onNavigate("acd")}>
            {!lesson3Done && (
              <span className="badge absolute top-4 right-4 rounded-full bg-cy-yellow px-[10px] py-1 text-[11px] font-extrabold tracking-[0.06em] text-[#5b4c00] uppercase">
                up next
              </span>
            )}
            <div className="mb-3 grid size-11 place-items-center rounded-[13px] bg-cy-amber-soft text-[21px]">
              🕵️
            </div>
            <h2 className="text-[19px] font-extrabold tracking-[-0.01em]">
              ACD Tutor
            </h2>
            <p className="mt-[5px] text-[14.5px] leading-normal text-muted">
              {lesson3Done
                ? "Lesson 3 complete ✓ Next: Contagion — purity spreads through the call graph."
                : `${ACD_LESSON.title} — mark every line that touches the outside world.`}
            </p>
            <span className="mt-[14px] inline-flex items-center gap-[6px] text-sm font-bold text-cy-amber-dark">
              Open {ACD_LESSON.fileName}{" "}
              <i className="not-italic transition-transform duration-[160ms] group-hover:translate-x-1">
                →
              </i>
            </span>
          </button>

          <button
            className={`${CARD} soc`}
            onClick={() => onNavigate("socratic")}
          >
            <div className="mb-3 grid size-11 place-items-center rounded-[13px] bg-[#ffe5d6] text-[21px]">
              💭
            </div>
            <h2 className="text-[19px] font-extrabold tracking-[-0.01em]">
              Socratic Tutor
            </h2>
            <p className="mt-[5px] text-[14.5px] leading-normal text-muted">
              Ask me anything — homework, science, big weird questions. I only
              ask back.
            </p>
            <span className="mt-[14px] inline-flex items-center gap-[6px] text-sm font-bold text-cy-orange">
              Start asking{" "}
              <i className="not-italic transition-transform duration-[160ms] group-hover:translate-x-1">
                →
              </i>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
