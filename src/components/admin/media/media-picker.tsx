"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MediaItem } from "@/lib/media/merge";
import { MediaLibrary } from "@/components/admin/media/media-library";

/**
 * A "Choose image" trigger plus a modal wrapping `MediaLibrary` in picker
 * mode. Lives beside an image-URL `<input>` and writes the chosen URL into
 * it by id.
 *
 * The trigger and the modal never render a native `<form>`, and every button
 * inside is `type="button"` — this sits inside the blog/works form's own
 * `<form>`, and a stray submit-type button here would post the host form the
 * moment it's clicked.
 */
export function MediaPicker({
  targetId,
  items,
  blobError,
}: {
  targetId: string;
  items: MediaItem[];
  blobError: string | null;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    // Restore focus to the control that opened the modal, rather than
    // leaving focus stranded on whatever DOM node the modal happened to
    // remove.
    triggerRef.current?.focus();
  }, []);

  // Move focus into the dialog once it exists, rather than leaving it on the
  // trigger button behind the overlay — the aria-modal="true" below promises
  // assistive tech that focus is contained, and nothing enforced that.
  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  // Escape closes the modal. The listener is only attached while the modal
  // is open, and effect cleanup removes it on close or unmount either way —
  // it never lingers to fire for some other modal.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // By the time a listener attached directly to `document` runs, the
        // keydown has already bubbled through every element below it —
        // including the host form's own listeners, if it had any — so this
        // stopPropagation() cannot and does not stop the event from reaching
        // them; that already happened. What it actually stops is any other
        // document-level (or window-level) Escape listener registered after
        // this one, so a second open dialog does not also react to the same
        // keypress.
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const handleSelect = useCallback(
    (url: string) => {
      // The field is an uncontrolled input rendered with `defaultValue`, so
      // a plain `input.value = url` would change the DOM node without React
      // ever observing it. Going through the native setter and dispatching a
      // bubbling `input` event is what makes React's own change tracking
      // (and the surrounding form's later `FormData` read) see the new value.
      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        setter?.call(input, url);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      close();
    },
    [targetId, close],
  );

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap rounded-sm border border-rule-strong bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-graphite transition-colors hover:bg-black/[0.05]"
      >
        Choose image
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
          onClick={close}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-sm bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-4">
              <h2 id={titleId} className="text-[1.0625rem] font-semibold text-graphite">
                Choose an image
              </h2>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={close}
                className="shrink-0 rounded-sm border border-rule-strong px-3 py-1 text-[0.8125rem] font-medium text-graphite hover:bg-black/[0.05]"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
              <MediaLibrary items={items} blobError={blobError} onSelect={handleSelect} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
