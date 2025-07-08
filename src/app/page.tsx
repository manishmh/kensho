import { auth } from "@/auth/auth";
import HomeClientWrapper from "@/components/HomeClientWrapper";
import HomeContent from "@/components/HomeContent";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <HomeClientWrapper>
      <HomeContent />
    </HomeClientWrapper>
  );
}
