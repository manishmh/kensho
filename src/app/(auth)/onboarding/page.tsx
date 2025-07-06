import { auth } from "@/auth/auth";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const OnboardingPage = async () => {
  const session = await auth();

  // If not authenticated, redirect to login
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Check if user has already completed onboarding
  try {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { onboardingCompleted: true },
    });

    if (user?.onboardingCompleted) {
      // User has already completed onboarding, redirect to home
      redirect("/");
    }
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // On error, continue to onboarding (fail-safe)
  }

  // User hasn't completed onboarding, show the onboarding flow
  return <OnboardingFlow />;
};

export default OnboardingPage;
