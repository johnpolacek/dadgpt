import gsap from "gsap";

// One page owns the outro at a time. It registers on mount and the link plays it before navigating.
type Outro = () => gsap.core.Timeline;
let outro: Outro | null = null;
let busy = false;
let safety: ReturnType<typeof setTimeout> | undefined;

export function registerOutro(fn: Outro) {
  outro = fn;
  return () => {
    if (outro === fn) outro = null;
  };
}

/** The incoming page calls this as its intro starts, so a click mid-intro can leave again. */
export function releaseNavigation() {
  busy = false;
  clearTimeout(safety);
}

/** Plays the current page's outro, then runs `go` once. Extra clicks while leaving are ignored. */
export function leaveThen(go: () => void) {
  if (busy) return;
  busy = true;
  // If the next page never reports in, links come back to life anyway
  safety = setTimeout(releaseNavigation, 5000);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    // Let the end state paint first. A hidden tab never fires frames, so race a timeout.
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      go();
    };
    requestAnimationFrame(fire);
    setTimeout(fire, 100);
  };

  const timeline = outro?.();
  if (!timeline) return finish();
  timeline.eventCallback("onComplete", finish);
  timeline.eventCallback("onInterrupt", finish);
  // GSAP's ticker stalls in a hidden tab, so never wait on it forever
  setTimeout(finish, timeline.duration() * 1000 + 1000);
}
