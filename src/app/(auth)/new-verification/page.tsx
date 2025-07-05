import { AuthLayout } from "@/components/auth/AuthLayout";
import { NewVerificationForm } from "@/components/auth/NewVerificationForm";
import { Suspense } from "react";

const NewVerificationPage = () => {
  return (
    <AuthLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <NewVerificationForm />
      </Suspense>
    </AuthLayout>
  );
};

export default NewVerificationPage;
