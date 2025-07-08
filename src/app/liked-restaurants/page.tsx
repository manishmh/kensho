import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";
import LikedRestaurantsContent from "@/components/LikedRestaurantsContent";

export default async function LikedRestaurantsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <LikedRestaurantsContent />;
}

export const metadata = {
  title: "Liked Restaurants | Kensho",
  description: "Your favorite restaurants saved for easy access",
}; 