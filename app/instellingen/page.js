import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logout } from "@/app/auth-actions";
import { formatDate } from "@/lib/format";
import { NOTE_TYPE } from "@/lib/constants";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export const metadata = { title: "Instellingen" };

/// "1 notitie" of "3 notities".
function count(amount, one, many) {
  return `${amount} ${amount === 1 ? one : many}`;
}

export default async function SettingsPage() {
  const user = await requireUser();

  // Wat er gewist wordt, zodat je weet waar je ja tegen zegt. De soort
  // "notitie" tellen we niet mee: die maak je niet zelf.
  const [noteCount, itemCount, typeCount, linkCount] = await Promise.all([
    prisma.item.count({ where: { userId: user.id, type: { name: NOTE_TYPE.name } } }),
    prisma.item.count({ where: { userId: user.id, type: { name: { not: NOTE_TYPE.name } } } }),
    prisma.itemType.count({ where: { userId: user.id, name: { not: NOTE_TYPE.name } } }),
    prisma.connection.count({ where: { fromItem: { userId: user.id } } }),
  ]);

  const summary = [
    count(noteCount, "notitie", "notities"),
    count(itemCount, "item", "items"),
    count(typeCount, "soort", "soorten"),
    count(linkCount, "verbinding", "verbindingen"),
  ].join(", ");

  return (
    <main className="page">
      <h1 className="view-title">Instellingen</h1>

      <section className="mt-10 card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-semibold">Account</h2>
          {/* Uitloggen staat hier en niet in het dock: je doet het zelden. */}
          <form action={logout}>
            <button type="submit" className="btn btn-sm">
              Uitloggen
            </button>
          </form>
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-ink-3">E-mailadres</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-ink-3">Lid sinds</dt>
          <dd>{formatDate(user.createdAt)}</dd>
          <dt className="text-ink-3">Opgeslagen</dt>
          <dd>{summary}</dd>
        </dl>
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <h2 className="font-semibold">Account wissen</h2>
        <p className="text-sm text-ink-2">
          Alles wat je in dit notitieboek hebt gezet wordt gewist. Er blijft niets
          van je achter.
        </p>
        <DeleteAccountForm summary={summary} />
      </section>
    </main>
  );
}