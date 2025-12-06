"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function SignInOutButton() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  return (
    <button
      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 transition rounded"
      onClick={() => (isAuthed ? signOut() : signIn("google"))}
    >
      {isAuthed ? "ログアウト" : "Googleでログイン"}
    </button>
  );
}
