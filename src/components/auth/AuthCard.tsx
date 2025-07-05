"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const AuthCard = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
}: CardWrapperProps) => {
  return (
    <Card className="w-[400px] shadow-lg border border-gray-200 bg-white">
      <CardHeader className="space-y-1 pb-4">
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Kensho</h1>
            <p className="text-gray-600 text-sm font-medium">{headerLabel}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {showSocial && <CardFooter>{/* Social Login Buttons */}</CardFooter>}
      <CardFooter className="pt-4">
        <Link href={backButtonHref} className="w-full">
          <button className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer font-medium">
            {backButtonLabel}
          </button>
        </Link>
      </CardFooter>
    </Card>
  );
};
