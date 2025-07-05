import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetForm } from "@/components/auth/ResetForm";

const ForgotPasswordPage = () => {
  return (
    <AuthLayout>
      <ResetForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
