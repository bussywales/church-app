"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  function handleSignIn() {
    document.cookie = "demo-auth=1; path=/; max-age=86400";
    router.push("/admin");
    router.refresh();
  }

  return (
    <Card className="max-w-md">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-2 text-slate-600">Demo login for local protected route check.</p>
      <div className="mt-4 space-y-3">
        <Input placeholder="Email" type="email" />
        <Input placeholder="Password" type="password" />
        <Button type="button" onClick={handleSignIn}>
          Sign in
        </Button>
      </div>
    </Card>
  );
}
