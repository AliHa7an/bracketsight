"use client";

/**
 * M7 — pinned scenarios.
 *
 * Pin the current state, keep editing, compare pinned versions. This is what
 * converts one-shot intent into a session and a return visit, and it costs
 * nothing because there is no backend: pins live in `localStorage` under a
 * versioned key, and each carries a compressed URL (see `src/lib/url-state.ts`)
 * so a scenario can be sent to a spouse or a forum thread.
 *
 * The component is presentational — it takes pins as data, per the design
 * contract. `useScenarioPins` below owns the storage and is the intended
 * wiring; keeping them separate means a page can drive pins from the URL alone
 * if it wants to.
 *
 * Nothing animates. Pins appear and disappear on the frame the user asks for
 * them, which is the correct response to a direct action.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "./Button";

/* ------------------------------------------------------------------ storage */

/**
 * Versioned: a format change orphans old pins instead of misreading them.
 *
 * Namespaced `bracketsight.*` because the five tools now share one origin and so
 * one localStorage. Renamed from the pre-merge `atlas.pins.v1`; only loans ever
 * wrote that key, and nothing had shipped, so no migration is needed — any
 * stale value is simply ignored, which is what versioning is for.
 */
export const PINS_STORAGE_KEY = "bracketsight.pins.v1";

/** Comparison stops being comparison somewhere past half a dozen. */
export const MAX_PINS = 6;

export interface ScenarioPin {
  id: string;
  /** User-facing name. Defaults to "Scenario 3". */
  name: string;
  /** One line of engine-computed detail: "RAP · $214/mo · $128,404 total". */
  summary: string;
  /** Shareable compressed URL for this scenario. */
  url: string;
  /** ISO timestamp. Used for ordering only. */
  createdAt: string;
}

function isPin(value: unknown): value is ScenarioPin {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.summary === "string" &&
    typeof p.url === "string" &&
    typeof p.createdAt === "string"
  );
}

/* localStorage is an external store, so it is read through
   `useSyncExternalStore` rather than copied into state by an effect: the
   server renders no pins, hydration matches exactly, and the real pins arrive
   in the first client render after it. No flash, no cascading render. */

const NO_PINS: ScenarioPin[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedPins: ScenarioPin[] = NO_PINS;
let cacheValid = false;
/** Set when a write is refused (quota, private mode). Pins then live only in
    memory for the session — the snapshot must stay referentially stable or
    `useSyncExternalStore` will loop. */
let memoryOnly = false;

function parsePins(raw: string | null): ScenarioPin[] {
  if (!raw) return NO_PINS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return NO_PINS;
    return parsed.filter(isPin).slice(0, MAX_PINS);
  } catch {
    return NO_PINS; // corrupt storage is the same as no pins
  }
}

function getPinsSnapshot(): ScenarioPin[] {
  if (typeof window === "undefined") return NO_PINS;
  if (memoryOnly) return cachedPins;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PINS_STORAGE_KEY);
  } catch {
    memoryOnly = true;
    return cachedPins;
  }
  if (cacheValid && raw === cachedRaw) return cachedPins;
  cachedRaw = raw;
  cachedPins = parsePins(raw);
  cacheValid = true;
  return cachedPins;
}

function getServerPinsSnapshot(): ScenarioPin[] {
  return NO_PINS;
}

function subscribePins(onChange: () => void): () => void {
  listeners.add(onChange);
  // Two tabs, one borrower: keep them in step.
  const onStorage = (event: StorageEvent) => {
    if (event.key === PINS_STORAGE_KEY || event.key === null) {
      cacheValid = false;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function writePins(next: ScenarioPin[]): void {
  const serialized = JSON.stringify(next);
  try {
    window.localStorage.setItem(PINS_STORAGE_KEY, serialized);
    cachedRaw = serialized;
  } catch {
    memoryOnly = true; // the pin still works for this session
  }
  cachedPins = next;
  cacheValid = true;
  for (const listener of listeners) listener();
}

/**
 * localStorage-backed pin store. Writes are best-effort: a full or blocked
 * quota loses the pin on reload, never the session.
 */
export function useScenarioPins(): {
  pins: ScenarioPin[];
  addPin: (input: { summary: string; url: string; name?: string }) => ScenarioPin | null;
  removePin: (id: string) => void;
  renamePin: (id: string, name: string) => void;
  clearPins: () => void;
} {
  const pins = useSyncExternalStore(subscribePins, getPinsSnapshot, getServerPinsSnapshot);

  const addPin = useCallback(
    (input: { summary: string; url: string; name?: string }): ScenarioPin | null => {
      // Reads the store rather than closing over state, so the caller gets the
      // created pin back synchronously and the callback never goes stale.
      const current = getPinsSnapshot();
      if (current.length >= MAX_PINS) return null;
      const created: ScenarioPin = {
        id: `pin-${Date.now().toString(36)}-${current.length}`,
        name: input.name?.trim() || `Scenario ${current.length + 1}`,
        summary: input.summary,
        url: input.url,
        createdAt: new Date().toISOString(),
      };
      writePins([...current, created]);
      return created;
    },
    [],
  );

  const removePin = useCallback((id: string) => {
    writePins(getPinsSnapshot().filter((p) => p.id !== id));
  }, []);

  const renamePin = useCallback((id: string, name: string) => {
    writePins(getPinsSnapshot().map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const clearPins = useCallback(() => writePins([]), []);

  return { pins, addPin, removePin, renamePin, clearPins };
}

/* ---------------------------------------------------------------- component */

export interface ScenarioPinsProps {
  pins: Pick<ScenarioPin, "id" | "name" | "summary" | "url">[];
  onPin: () => void;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
  /** Defaults to MAX_PINS. */
  maxPins?: number;
  className?: string;
}

export function ScenarioPins({
  pins,
  onPin,
  onRemove,
  onRestore,
  maxPins = MAX_PINS,
  className,
}: ScenarioPinsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailedId, setCopyFailedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = (pin: { id: string; url: string }) => {
    const done = (ok: boolean) => {
      setCopiedId(ok ? pin.id : null);
      setCopyFailedId(ok ? null : pin.id);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (ok) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setCopiedId(null);
        }, 2000);
      }
    };

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      done(false);
      return;
    }
    navigator.clipboard.writeText(pin.url).then(
      () => done(true),
      () => done(false),
    );
  };

  const full = pins.length >= maxPins;

  return (
    <section className={className} aria-labelledby="scenario-pins-label">
      <div className="flex items-baseline justify-between gap-4">
        <span id="scenario-pins-label" className="micro-label">
          Pinned scenarios
        </span>
        <span className="num text-dim" style={{ fontSize: "var(--text-step--2)" }}>
          {pins.length} of {maxPins}
        </span>
      </div>

      {pins.length === 0 ? (
        <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Pin this scenario to hold it while you change the numbers, then compare the two.
        </p>
      ) : (
        <ul className="mt-3">
          {pins.map((pin) => (
            <li
              key={pin.id}
              className="hairline-all mt-2 rounded-atlas p-3 first:mt-0"
            >
              <p className="font-medium" style={{ fontSize: "var(--text-step--1)" }}>
                {pin.name}
              </p>
              <p
                className="num text-dim"
                style={{ fontSize: "var(--text-step--1)", lineHeight: 1.35 }}
              >
                {pin.summary}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => onRestore(pin.id)}>
                  Load this scenario
                </Button>
                <Button variant="ghost" size="sm" onClick={() => copy(pin)}>
                  {copiedId === pin.id ? "Link copied" : "Copy link"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onRemove(pin.id)}>
                  Remove
                </Button>
              </div>
              {copyFailedId === pin.id ? (
                <div className="mt-2">
                  <p className="text-dim" style={{ fontSize: "var(--text-step--2)" }}>
                    Your browser blocked the copy. Select this link instead:
                  </p>
                  <p
                    className="num break-all text-ink"
                    style={{ fontSize: "var(--text-step--2)", userSelect: "all" }}
                  >
                    {pin.url}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={onPin} disabled={full}>
          Pin this scenario
        </Button>
        {full ? (
          <p className="mt-2 text-dim" style={{ fontSize: "var(--text-step--2)" }}>
            Remove a pin to add another.
          </p>
        ) : null}
      </div>
    </section>
  );
}
