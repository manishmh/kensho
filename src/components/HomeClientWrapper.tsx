"use client";

import Navbar from "@/components/Navbar";

interface HomeClientWrapperProps {
  children: React.ReactNode;
}

export default function HomeClientWrapper({
  children,
}: HomeClientWrapperProps) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
