import React, { useEffect, useRef } from "react";

export default function GameMenu({
  onOpenChange,
  saved = false,
}: {
  onOpenChange?: (open: boolean) => void;
  saved?: boolean;
}): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const callback = useRef(onOpenChange);
  callback.current = onOpenChange;
  const open = (): void => {
    callback.current?.(true);
    dialog.current?.showModal();
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent): void => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        document.querySelector("dialog[open]")
      )
        return;
      event.preventDefault();
      callback.current?.(true);
      dialog.current?.showModal();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <>
      <button className="g-menu-button" onClick={open}>
        Menu <kbd>Esc</kbd>
      </button>
      <dialog
        className="g-dialog g-exit"
        ref={dialog}
        onClose={() => callback.current?.(false)}
        aria-labelledby="game-menu-title"
      >
        <span className="g-eyebrow">Take a breather</span>
        <h2 id="game-menu-title">The world can wait.</h2>
        <p>
          {saved
            ? "Your progress stays in this browser. The simulation pauses while you’re away."
            : "This encounter pauses here. Leaving the page starts a fresh encounter when you return."}
        </p>
        <button className="g-primary" onClick={() => dialog.current?.close()}>
          Resume game
        </button>
        <a className="g-link-button" href="/design/saas-game-ui">
          Explore the design system ↗
        </a>
        <p className="g-small">Three games. One language for software.</p>
      </dialog>
    </>
  );
}
