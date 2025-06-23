"use client";
import { store } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<typeof store | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!storeRef.current) {
    storeRef.current = store;
  }

  // Prevent hydration mismatch by only rendering on client
  if (!hasMounted) {
    return <div>{children}</div>;
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
