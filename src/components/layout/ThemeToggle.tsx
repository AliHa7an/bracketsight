"use client";

import * as React from "react";

/**
 * The theme control. Three states, one button.
 *
 *   system  no `data-theme` on <html>, no key in storage — `prefers-color-
 *           scheme` decides. This is the default and it is a real state, not
 *           the absence of one: a reader whose OS switches at sunset should
 *           switch with it unless they have said otherwise.
 *   light   `data-theme="light"`, which beats the media query.
 *   dark    `data-theme="dark"`, likewise.
 *
 * The cycle is system → light → dark → system, so "back to whatever my machine
 * says" is always two presses away and never buried in a menu.
 *
 * WHAT THIS COMPONENT DOES NOT DO is decide the theme on first paint. That is
 * the blocking script in app/layout.tsx, which reads the same storage key
 * before anything is drawn. This one only writes, and reads back on mount to
 * label itself. Until it has mounted it renders a button of exactly the same
 * size with no label — see the note on `mounted` — so the header does not
 * change width when it hydrates.
 *
 * The storage key is the contract with that script. Change it in one place and
 * every reader silently loses their choice.
 */

const KEY = "bracketsight-theme";

type Choice = "system" | "light" | "dark";

const NEXT: Record<Choice, Choice> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<Choice, string> = {
  system: "Theme: match my system",
  light: "Theme: light",
  dark: "Theme: dark",
};

function read(): Choice {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
}

function apply(choice: Choice): void {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* private mode: the choice lasts for this page only, which is honest. */
    }
    return;
  }
  root.setAttribute("data-theme", choice);
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* as above */
  }
}

export function ThemeToggle() {
  /*
   * The server cannot know the reader's choice, so the first client render must
   * match the server's markup exactly or React will complain and, worse, will
   * have drawn the wrong icon. `mounted` holds the button at its final size
   * with no glyph for one frame instead.
   */
  const [mounted, setMounted] = React.useState(false);
  const [choice, setChoice] = React.useState<Choice>("system");

  React.useEffect(() => {
    setChoice(read());
    setMounted(true);
  }, []);

  const next = NEXT[choice];

  return (
    <button
      type="button"
      onClick={() => {
        apply(next);
        setChoice(next);
      }}
      aria-label={mounted ? `${LABEL[choice]}. Switch to ${LABEL[next].toLowerCase()}` : "Theme"}
      title={mounted ? LABEL[choice] : undefined}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-atlas border border-rule text-dim transition-colors hover:border-ink hover:text-ink"
      style={{ transitionDuration: "var(--dur-fast)" }}
    >
      {mounted ? <Glyph choice={choice} /> : <span className="block h-4 w-4" />}
      <span className="sr-only">{mounted ? LABEL[choice] : "Theme"}</span>
    </button>
  );
}

/**
 * Three marks in one 16-unit box, drawn rather than imported.
 *   system  a circle half-filled — the machine decides which half.
 *   light   a sun: a disc and eight rays.
 *   dark    a crescent, cut from the same disc.
 */
function Glyph({ choice }: { choice: Choice }) {
  if (choice === "dark") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M13.2 10.3A5.6 5.6 0 0 1 5.7 2.8a5.6 5.6 0 1 0 7.5 7.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (choice === "light") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="3.1" />
        <path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2.4a5.6 5.6 0 0 1 0 11.2Z" fill="currentColor" />
    </svg>
  );
}
