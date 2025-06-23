"use client";

import { register } from "@/actions/register";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormError } from "@/components/FormError";
import { FormSuccess } from "@/components/FormSuccess";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RegisterSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export const RegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [debugInfo, setDebugInfo] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    console.log("🚀 Client: Starting registration for:", values.email);
    setError("");
    setSuccess("");
    setDebugInfo("");

    startTransition(() => {
      register(values)
        .then((data) => {
          console.log("🔄 Client: Registration response received:", data);

          setError(data.error);
          setSuccess(data.success);

          // Show debug info in development or if there's an error
          if (data.debug || data.details) {
            const debugText = `Debug: ${
              data.debug || "No debug info"
            } | Details: ${data.details || "No details"}`;
            setDebugInfo(debugText);
            console.log("🔍 Client: Debug info:", debugText);
          }

          // Handle redirect based on response
          if (data.success && data.shouldRedirect && data.redirectTo) {
            console.log(
              `✅ Registration successful, redirecting to ${data.redirectTo}...`
            );
            setTimeout(() => {
              router.push(data.redirectTo);
            }, 2000); // 2 second delay to show success message
          }
        })
        .catch((clientError) => {
          console.error(
            "💥 Client: Registration failed with error:",
            clientError
          );
          setError("Client-side error occurred");
          setDebugInfo(
            `Client error: ${clientError.message || "Unknown client error"}`
          );
        });
    });
  };

  return (
    <AuthCard
      headerLabel="Create an account"
      backButtonLabel="Already have an account?"
      backButtonHref="/login"
      showSocial
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="your.email@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="******" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          {debugInfo && (
            <div className="bg-yellow-500/15 p-3 rounded-md text-sm text-yellow-600">
              <p>
                <strong>Debug Info:</strong> {debugInfo}
              </p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create an account"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};
