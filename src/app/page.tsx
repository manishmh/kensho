import { auth } from "@/auth/auth";
import HomeClientWrapper from "@/components/HomeClientWrapper";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <HomeClientWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Welcome to Kensho
          </h1>
          <p className="text-gray-600 mb-8">
            Your personalized food ordering experience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">
                Restaurants Near You
              </h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Popular Dishes</h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Your Favorites</h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </HomeClientWrapper>
  );
}
