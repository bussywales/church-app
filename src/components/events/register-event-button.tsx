import Link from "next/link";

type RegisterEventButtonProps = {
  eventId: string;
  capacityReached: boolean;
  isAuthenticated: boolean;
};

export function RegisterEventButton({ eventId, capacityReached, isAuthenticated }: RegisterEventButtonProps) {
  if (capacityReached) {
    return (
      <button
        type="button"
        disabled
        className="rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-slate-600"
      >
        Capacity reached
      </button>
    );
  }

  const registerPath = `/events/${eventId}/register`;
  const href = isAuthenticated ? registerPath : `/login?next=${encodeURIComponent(registerPath)}`;

  return (
    <Link
      href={href}
      className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
    >
      Register
    </Link>
  );
}
