import Link from "next/link";
import { logout } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/session";
import { ROUTES } from "@/lib/constants";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  // Uitgelogd tonen we niets: de inlogpagina heeft geen balk nodig.
  if (!user) return null;

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
        <nav className="flex items-center gap-4">
          <Link href={ROUTES.HOME} className="font-semibold">
            Noteboek
          </Link>
          <Link href={ROUTES.TYPES} className="text-sm text-ink-2 hover:text-ink">
            Soorten
          </Link>
          <Link href={ROUTES.SEARCH} className="text-sm text-ink-2 hover:text-ink">
            Zoeken
          </Link>
        </nav>

        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={ROUTES.SETTINGS}
            className="truncate text-sm text-ink-3 hover:text-ink"
            title="Instellingen"
          >
            {user.email}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="btn btn-sm"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}