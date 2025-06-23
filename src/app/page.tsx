import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full max-w-2xl">
      <Card className="w-full shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Notion Syncer
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Sync data from any API to your Notion databases seamlessly
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Get Started
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Sign in to your account or create a new one to start syncing
                your data
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href="/login" className="flex-1">
                <Button className="w-full" size="lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
