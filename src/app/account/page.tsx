import { requireUser, getCurrentProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const profile = await getCurrentProfile();

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="mt-2 text-slate-600">Your authenticated profile.</p>

      <dl className="mt-6 space-y-2 text-sm">
        <div>
          <dt className="font-medium text-slate-700">Email</dt>
          <dd className="text-slate-900">{user.email}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">Role</dt>
          <dd className="text-slate-900">{profile?.role ?? "MEMBER"}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </Card>
  );
}
