"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register";

export function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const next = searchParams.get("next") || "/account";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
      setLoading(false);
      return;
    }

    const { data, error: registerError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (registerError) {
      setError(registerError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email ?? email,
          role: "MEMBER",
        },
        { onConflict: "id" },
      );
    }

    setMessage("Account created. You can now sign in.");
    setMode("login");
    setPassword("");
    setLoading(false);
  }

  return (
    <Card className="max-w-md">
      <div className="mb-4 flex gap-2 rounded-md bg-slate-100 p-1">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            mode === "login" ? "bg-white text-slate-900" : "text-slate-600"
          }`}
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
        >
          Login
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            mode === "register" ? "bg-white text-slate-900" : "text-slate-600"
          }`}
          onClick={() => {
            setMode("register");
            setError(null);
            setMessage(null);
          }}
        >
          Register
        </button>
      </div>

      <h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
      <p className="mt-2 text-slate-600">
        {mode === "login" ? "Sign in with email and password." : "Register with email and password."}
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          required
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          required
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
    </Card>
  );
}
