import { act, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

// Regression: scrollIntoView({behavior:"smooth"}) returns a Promise in newer Chrome/Android
// WebViews. An effect written as `() => end.current?.scrollIntoView(...)` returns that Promise
// as its cleanup, and React's production build calls the stored cleanup on the next effect run:
// "TypeError: l is not a function" took down اسأل رفيق on every message send. The braced body
// below is the fixed pattern used in src/routes/assistant.tsx.

function SmoothScroller({ tick }: { tick: number }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [tick]);
  return <div ref={end}>msgs {tick}</div>;
}

describe("effect cleanup safety", () => {
  it("survives re-renders when scrollIntoView returns a Promise", async () => {
    Element.prototype.scrollIntoView = (() => Promise.resolve()) as unknown as typeof Element.prototype.scrollIntoView;
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => root.render(<SmoothScroller tick={0} />));
    // The next renders re-run the effect: the stored cleanup (a Promise with the old pattern)
    // would be called here and crash. With the braced body there is nothing to call.
    await act(async () => root.render(<SmoothScroller tick={1} />));
    await act(async () => root.render(<SmoothScroller tick={2} />));

    expect(host.textContent).toContain("msgs 2");
    await act(async () => root.unmount());
  });
});
