import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { Card } from "@/components/ui/card";

export default async function AdminPage() {
  const { profile } = await requireRole(ADMIN_ROLES);

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-slate-600">Restricted admin area for elevated roles.</p>
      <p className="mt-3 text-sm text-slate-700">Current role: {profile.role}</p>
    </Card>
  );
}
