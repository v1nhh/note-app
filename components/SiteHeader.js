import Link from "next/link";
import { logout } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/session";
import { ROUTES } from "@/lib/constants";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  // Uitgelogd tonen we niets: de inlogpagina heeft geen balk nodig.
  if (!user) return null;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
        <nav className="flex items-center gap-4">
          <Link href={ROUTES.HOME} className="font-semibold">
            Noteboek
          </Link>
          <Link href={ROUTES.TYPES} className="text-sm text-neutral-600 hover:text-neutral-900">
            Soorten
          </Link>
          <Link href={ROUTES.SEARCH} className="text-sm text-neutral-600 hover:text-neutral-900">
            Zoeken
          </Link>
        </nav>

        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={ROUTES.SETTINGS}
            className="truncate text-sm text-neutral-500 hover:text-neutral-900"
            title="Instellingen"
          >
            {user.email}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-500"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}