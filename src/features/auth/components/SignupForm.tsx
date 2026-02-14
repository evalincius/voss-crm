import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { signupSchema } from "@/features/auth/schemas/auth.schema";
import { signUpWithEmail } from "@/features/auth/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants";
import type { SignupSchema } from "@/features/auth/schemas/auth.schema";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: SignupSchema) {
    setServerError(null);
    const result = await signUpWithEmail(data.email, data.password, data.fullName);

    if (result.error) {
      setServerError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border px-4 py-3 text-sm">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          {...register("fullName")}
        />
        {errors.fullName && <p className="text-destructive text-sm">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-text-secondary text-center text-sm">
        Already have an account?{" "}
        <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
