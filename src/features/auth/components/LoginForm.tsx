import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { loginSchema } from "@/features/auth/schemas/auth.schema";
import { signInWithPassword } from "@/features/auth/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants";
import type { LoginSchema } from "@/features/auth/schemas/auth.schema";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginSchema) {
    setServerError(null);
    const result = await signInWithPassword(data.email, data.password);

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
          placeholder="Enter your password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-text-secondary text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to={ROUTES.SIGNUP} className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
