import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="">
      <LogoutButton>
        <Button variant="outline" size="lg" className="min-w-[120px]">
          Logout
        </Button>
      </LogoutButton>
    </div>
  );
}
