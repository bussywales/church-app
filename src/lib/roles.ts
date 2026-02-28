export const ALL_ROLES = ["MEMBER", "ADMIN", "SUPER_ADMIN", "EVENTS_LEAD", "FINANCE"] as const;

export type AppRole = (typeof ALL_ROLES)[number];

export const CONTENT_ADMIN_ROLES: AppRole[] = ["SUPER_ADMIN", "ADMIN", "EVENTS_LEAD"];
export const ADMIN_ROLES: AppRole[] = CONTENT_ADMIN_ROLES;
export const FINANCE_ROLES: AppRole[] = ["SUPER_ADMIN", "ADMIN", "FINANCE"];

export function normalizeRole(value: string | null | undefined): AppRole {
  if (!value) {
    return "MEMBER";
  }

  const maybeRole = value.toUpperCase() as AppRole;

  return ALL_ROLES.includes(maybeRole) ? maybeRole : "MEMBER";
}
