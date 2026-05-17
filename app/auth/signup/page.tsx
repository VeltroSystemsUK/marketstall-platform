"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/site.config";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["consumer", "producer"]),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "consumer" },
  });

  const role = watch("role");

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.name, data.role);
      toast.success(`Account created! Welcome to ${config.brand.name}.`);
      router.push(data.role === "producer" ? "/producer/onboarding" : "/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      toast.error(
        msg.includes("email-already-in-use")
          ? "Email already in use"
          : "Sign up failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch {
      toast.error("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold text-forest-800"
          >
            <Store className="h-7 w-7 text-forest-600" />
            {config.brand.name}
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold text-gray-900">
            Create account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Join the East Midlands food community
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          {/* Role toggle */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            {(["consumer", "producer"] as const).map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer flex-col items-center rounded-xl border p-3 text-center transition-colors ${role === r ? "border-forest-500 bg-forest-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <input
                  type="radio"
                  value={r}
                  {...register("role")}
                  className="sr-only"
                />
                <span className="text-lg">
                  {r === "consumer" ? "🛒" : "🌾"}
                </span>
                <span className="mt-1 text-xs font-medium capitalize text-gray-700">
                  {r}
                </span>
                <span className="mt-0.5 text-[10px] text-gray-400">
                  {r === "consumer" ? "I want to buy" : "I want to sell"}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Full name
              </label>
              <input
                {...register("name")}
                autoComplete="name"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                {...register("email")}
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-forest-700 hover:text-forest-900"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
