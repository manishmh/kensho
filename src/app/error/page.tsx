import { AuthCard } from "@/components/auth/AuthCard";

const ErrorPage = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <AuthCard
        headerLabel="Oops! Something went wrong."
        backButtonHref="/login"
        backButtonLabel="Back to login"
      >
        <div className="w-full flex justify-center items-center">
          <p>Please try again later.</p>
        </div>
      </AuthCard>
    </div>
  );
};

export default ErrorPage;
