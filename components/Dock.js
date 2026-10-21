"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import {
  IconNotes,
  IconTypes,
  IconGraph,
  IconSearch,
  IconSettings,
} from "@/components/icons";

/// De plekken in het dock. match: bij welke paden deze plek "aan" staat. Een
/// notitie hoort bij Notities, een item bij Soorten, ook al heeft het item
/// een eigen adres.
const PLACES = [
  {
    href: ROUTES.HOME,
    label: "Notities",
    Icon: IconNotes,
    match: (path) => path === ROUTES.HOME || path.startsWith("/notities"),
  },
  {
    href: ROUTES.TYPES,
    label: "Soorten",
    Icon: IconTypes,
    match: (path) => path.startsWith(ROUTES.TYPES) || path.startsWith("/items"),
  },
  {
    href: ROUTES.GRAPH,
    label: "Web",
    Icon: IconGraph,
    match: (path) => path.startsWith(ROUTES.GRAPH),
  },
  {
    href: ROUTES.SEARCH,
    label: "Zoeken",
    Icon: IconSearch,
    match: (path) => path.startsWith(ROUTES.SEARCH),
  },
  {
    href: ROUTES.SETTINGS,
    label: "Instellingen",
    Icon: IconSettings,
    match: (path) => path.startsWith(ROUTES.SETTINGS),
  },
];

/// Zwevende navigatie onderin het scherm. Een client component, omdat hij
/// moet weten op welke pagina je bent (usePathname) om die plek te markeren.
export default function Dock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hoofdmenu"
      // fixed: blijft staan als je scrolt. De onderkant houdt rekening met de
      // balk onderin een iPhone (safe-area-inset-bottom).
      className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex justify-center px-4"
    >
      <ul className="flex gap-1 rounded-full bg-card p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-line">
        {PLACES.map(({ href, label, Icon, match }) => {
          const active = match(pathname);

          return (
            <li key={href}>
              <Link
                href={href}
                // aria-current vertelt een schermlezer "hier ben je nu".
                aria-current={active ? "page" : undefined}
                className={`flex min-w-14 flex-col items-center gap-1 rounded-full px-2.5 py-2 text-[0.6875rem] font-medium transition-colors sm:min-w-16 sm:px-3 ${
                  active ? "bg-action text-action-text" : "text-ink-3 hover:bg-inset hover:text-ink"
                }`}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}