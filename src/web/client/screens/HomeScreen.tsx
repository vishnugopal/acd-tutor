import { useEffect, useState } from "react";
import { listLessonFiles } from "../api";
import { AppBar } from "../components/AppBar";
import { CodeBuddyLogo } from "../components/CodeBuddyLogo";
import { Mascot } from "../components/Mascot";
import { agentCourse, agentIcon, type CourseOutline } from "../data/agents";
import { STATIC_GAME } from "../data/gamification";
import { courseProgress } from "../../../shared/lesson-names";
import type { AgentInfo } from "../types";

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

function CourseStepper({
  course,
  files,
}: {
  course: CourseOutline;
  files: string[];
}) {
  const { current, done } = courseProgress(files);

  return (
    <div className="stepper-card rounded-[18px] border border-line bg-white p-[18px] shadow-panel">
      <h3 className="mb-[14px] text-[13px] font-bold tracking-[0.1em] text-muted uppercase">
        {course.title}
      </h3>
      <div className="stepper flex items-start overflow-x-auto pb-[6px]">
        {course.steps.map((step) => {
          const isDone = done.includes(step.number);
          const state = isDone ? "done" : step.number === current ? "cur" : "lock";
          return (
            <div
              key={step.number}
              className={`step ${state} relative w-[76px] flex-none text-center after:absolute after:top-[21px] after:left-[calc(50%+24px)] after:h-[2px] after:w-[calc(100%-48px)] after:content-[''] last:after:hidden ${
                isDone ? "after:bg-cy-amber" : "after:bg-line"
              }`}
            >
              <div className={`${NODE_BASE} ${NODE_BY_STATE[state]}`}>
                {isDone ? "✓" : `L${step.number}`}
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

export function HomeScreen({
  agents,
  onSelect,
}: {
  agents: AgentInfo[];
  onSelect: (agent: AgentInfo) => void;
}) {
  // Real workspace state (per course agent) drives the dashboard progress.
  const [workspaces, setWorkspaces] = useState<Record<string, string[]>>({});

  useEffect(() => {
    for (const agent of agents) {
      if (!agentCourse(agent.id)) continue;
      void listLessonFiles(agent.id)
        .then((files) =>
          setWorkspaces((prev) => ({ ...prev, [agent.id]: files })),
        )
        .catch(() => {});
    }
  }, [agents]);

  const startedCourses = agents.filter(
    (a) => agentCourse(a.id) && (workspaces[a.id]?.length ?? 0) > 0,
  );
  const anyStarted = startedCourses.length > 0;

  return (
    <section className="screen flex flex-1 flex-col animate-[fadeup_.4s_ease_both]">
      <AppBar brand={<CodeBuddyLogo />} />

      <div className="home-body mx-auto flex w-full max-w-[760px] flex-col gap-[22px] px-5 pt-[26px] pb-[60px]">
        <div className="hero-row flex items-center gap-4">
          <Mascot mood="idle" className="h-[84px] w-[90px]" />
          <div className="hero-bubble rounded-2xl rounded-bl-[4px] border border-line bg-white px-4 py-[10px] text-[15px] shadow-panel animate-[fadeup_.5s_ease_.15s_both]">
            {anyStarted
              ? "Welcome back! Your lessons are right where you left them. 🔍"
              : "Hi, I'm Beep! Pick a tutor below and let's learn something cool."}
          </div>
        </div>

        <div className="hello">
          <h1 className="text-[clamp(26px,5vw,34px)] font-extrabold tracking-[-0.02em]">
            Hey there, <em className="text-cy-amber-dark not-italic">learner</em>.
          </h1>
          <p className="mt-1 text-[15.5px] text-muted">
            Day {STATIC_GAME.streak} of your streak. Keep it going.
          </p>
        </div>

        {agents.map((agent) => {
          const course = agentCourse(agent.id);
          if (!course) return null;
          return (
            <CourseStepper
              key={agent.id}
              course={course}
              files={workspaces[agent.id] ?? []}
            />
          );
        })}

        <div className="cards grid grid-cols-1 gap-[14px] min-[720px]:grid-cols-2">
          {agents.map((agent) => {
            const ui = agentIcon(agent.id);
            const course = agentCourse(agent.id);
            const files = workspaces[agent.id] ?? [];
            const started = course !== undefined && files.length > 0;
            const { current } = courseProgress(files);
            return (
              <button
                key={agent.id}
                className={CARD}
                onClick={() => onSelect(agent)}
              >
                {course && !started && !anyStarted && (
                  <span className="badge absolute top-4 right-4 rounded-full bg-cy-yellow px-[10px] py-1 text-[11px] font-extrabold tracking-[0.06em] text-[#5b4c00] uppercase">
                    start here
                  </span>
                )}
                <div
                  className={`mb-3 grid size-11 place-items-center rounded-[13px] text-[21px] ${ui.iconBg}`}
                >
                  {ui.icon}
                </div>
                <h2 className="text-[19px] font-extrabold tracking-[-0.01em]">
                  {agent.label}
                </h2>
                <p className="mt-[5px] text-[14.5px] leading-normal text-muted">
                  {started && course
                    ? `You're on lesson ${current} of ${course.steps.length} — jump back in!`
                    : agent.description}
                </p>
                <span
                  className={`mt-[14px] inline-flex items-center gap-[6px] text-sm font-bold ${course ? "text-cy-amber-dark" : "text-cy-orange"}`}
                >
                  {course
                    ? started
                      ? "Continue learning"
                      : "Start learning"
                    : "Start asking"}{" "}
                  <i className="not-italic transition-transform duration-[160ms] group-hover:translate-x-1">
                    →
                  </i>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
