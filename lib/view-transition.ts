"use client";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => void;
};

type TransitionRouter = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

export function runViewTransition(update: () => void) {
  const doc = document as TransitionDocument;

  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(update);
    return;
  }

  update();
}

export function pushWithTransition(router: TransitionRouter, href: string) {
  runViewTransition(() => router.push(href));
}

export function replaceWithTransition(router: TransitionRouter, href: string) {
  runViewTransition(() => router.replace(href));
}
