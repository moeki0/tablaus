/* eslint-disable react-hooks/refs */
"use client";

import {
  FloatingFocusManager,
  FloatingPortal,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  useTransitionStyles,
} from "@floating-ui/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { IoMenu } from "react-icons/io5";

export function SignInOutButton() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [offset(8), flip(), shift()],
    placement: "bottom-end",
  });
  const { styles } = useTransitionStyles(context);

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const handleAction = () => {
    setOpen(false);
    return isAuthed ? signOut() : signIn("google");
  };

  return (
    <div className="relative">
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="p-2 rounded hover:bg-gray-100 transition"
        aria-label="メニューを開く"
      >
        <IoMenu size={22} />
      </button>

      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, ...styles }}
              {...getFloatingProps()}
              className="z-50 min-w-[160px] rounded border border-gray-100 bg-white shadow-lg py-1"
            >
              <button
                onClick={handleAction}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                {isAuthed ? "Log out" : "Log in with Google"}
              </button>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}
