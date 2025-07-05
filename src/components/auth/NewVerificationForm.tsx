"use client";

import { newVerification } from "@/actions/new-verification";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { FormError } from "../FormError";
import { FormSuccess } from "../FormSuccess";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError("Missing token!");
      return;
    }
    newVerification(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError("Something went wrong!");
      });
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">VERIFICATION</h1>
        <p className="text-gray-600">Confirming your email verification</p>
      </div>

      <div className="flex items-center w-full justify-center mb-6">
        {!success && !error && <BeatLoader color="#374151" />}
        <FormSuccess message={success} />
        {!success && <FormError message={error} />}
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};
