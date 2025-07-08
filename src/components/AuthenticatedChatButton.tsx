"use client";

import { useSession } from "next-auth/react";
import { FloatingChatButton } from "./FloatingChatButton";

export function AuthenticatedChatButton() {
  const { data: session } = useSession();

  // Only show the chat button if user is authenticated
  if (!session?.user) {
    return null;
  }

  return <FloatingChatButton />;
}
