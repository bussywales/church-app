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

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(registerPath)}`}
        className="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Log in to register
      </Link>
    );
  }

  return (
    <Link
      href={registerPath}
      className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
    >
      Register
    </Link>
  );
}
