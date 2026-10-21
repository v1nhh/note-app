import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { itemHref, mentionTargets } from "@/lib/links";
import { mentionExcerpt } from "@/lib/mentions";
import { formatDate } from "@/lib/format";

/// "Genoemd in": alles wat naar dit item verwijst. Er staat nergens een lijst
/// "Sarah wordt genoemd in…". We vragen de verbindingen andersom op: niet
/// waar ze vandaan komen (fromItemId), maar waar ze heen gaan (toItemId).
export default async function Backlinks({ userId, item }) {
  const [connections, targets] = await Promise.all([
    prisma.connection.findMany({
      // Ook hier userId: alleen stukken van deze gebruiker.
      where: { toItemId: item.id, fromItem: { userId } },
      orderBy: { fromItem: { date: "desc" } },
      include: {
        fromItem: {
          select: {
            id: true,
            title: true,
            body: true,
            date: true,
            type: { select: { name: true, icon: true } },
          },
        },
      },
    }),
    mentionTargets(userId),
  ]);

  return (
    <section className="mt-12 border-t border-neutral-200 pt-6">
      <h2 className="text-sm font-semibold text-neutral-500">
        Genoemd in {connections.length > 0 ? `(${connections.length})` : ""}
      </h2>

      {connections.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          Nog nergens genoemd. Schrijf @{item.title} in een notitie, dan verschijnt
          die hier.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {connections.map(({ fromItem }) => {
            const excerpt = mentionExcerpt(fromItem.body, targets, item.id);

            return (
              <li key={fromItem.id}>
                <Link
                  href={itemHref(fromItem.id, fromItem.type.name)}
                  className="block rounded-md border border-neutral-200 bg-white p-4 hover:border-neutral-400"
                >
                  <p className="text-sm text-neutral-500">
                    {fromItem.type.icon ? `${fromItem.type.icon} ` : ""}
                    {formatDate(fromItem.date)}
                  </p>
                  <h3 className="mt-1 font-semibold">{fromItem.title}</h3>
                  {excerpt && (
                    <p className="mt-2 text-sm text-neutral-700">
                      {excerpt.before}
                      <mark className="rounded bg-blue-50 px-0.5 font-medium text-blue-700">
                        {excerpt.mention}
                      </mark>
                      {excerpt.after}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}