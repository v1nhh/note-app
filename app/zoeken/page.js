import Form from "next/form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { searchItems } from "@/lib/search";
import { itemHref } from "@/lib/links";
import { formatDate } from "@/lib/format";
import { ROUTES, SEARCH_PARAMS } from "@/lib/constants";
import Highlight from "@/components/Highlight";

export const metadata = { title: "Zoeken" };

const inputClass = "rounded-md border border-neutral-300 bg-white px-3 py-2";

/// Een waarde uit de URL. ?q=a&q=b geeft een lijst; dan nemen we de eerste.
function readParam(params, name) {
  const value = params[name];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function SearchPage({ searchParams }) {
  const user = await requireUser();

  // Net als params is searchParams in Next 16 een promise.
  const params = await searchParams;
  const query = readParam(params, SEARCH_PARAMS.QUERY);
  const typeParam = readParam(params, SEARCH_PARAMS.TYPE);

  const types = await prisma.itemType.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  // Alleen een soort uit je eigen lijst telt. Een gegokte id van iemand
  // anders vindt hier niets en wordt genegeerd.
  const selectedType = types.find((type) => String(type.id) === typeParam) ?? null;

  const searching = query.trim() !== "" || selectedType !== null;
  const results = searching
    ? await searchItems(user.id, { query, typeId: selectedType?.id })
    : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Zoeken</h1>

      {/* Een GET-formulier: de zoekopdracht komt in de URL. Form van Next
          laadt de nieuwe resultaten zonder de hele pagina te herladen. */}
      <Form
        action={ROUTES.SEARCH}
        role="search"
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="search"
          name={SEARCH_PARAMS.QUERY}
          defaultValue={query}
          placeholder="Zoek in titels, tekst en velden"
          aria-label="Zoekwoord"
          className={`${inputClass} sm:flex-1`}
        />
        <select
          name={SEARCH_PARAMS.TYPE}
          defaultValue={selectedType ? String(selectedType.id) : ""}
          aria-label="Soort"
          className={inputClass}
        >
          <option value="">Alle soorten</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.icon ? `${type.icon} ` : ""}
              {type.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-white">
          Zoeken
        </button>
      </Form>

      {!searching ? (
        <p className="mt-10 text-neutral-500">
          Typ een zoekwoord, of kies een soort om alles van die soort te zien.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-10 text-neutral-500">
          Niets gevonden{query.trim() ? ` voor "${query.trim()}"` : ""}
          {selectedType ? ` bij ${selectedType.name}` : ""}.
        </p>
      ) : (
        <>
          {/* aria-live: een schermlezer hoort het aantal na een nieuwe zoekopdracht. */}
          <p className="mt-10 text-sm text-neutral-500" aria-live="polite">
            {results.length} {results.length === 1 ? "resultaat" : "resultaten"}
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {results.map(({ item, snippet }) => (
              <li key={item.id}>
                <Link
                  href={itemHref(item.id, item.type.name)}
                  className="block rounded-md border border-neutral-200 bg-white p-4 hover:border-neutral-400"
                >
                  <p className="text-sm text-neutral-500">
                    {item.type.icon ? `${item.type.icon} ` : ""}
                    {item.type.name} · {formatDate(item.date)}
                  </p>
                  <h2 className="mt-1 font-semibold">
                    <Highlight text={item.title} query={query} />
                  </h2>
                  {snippet && (
                    <p className="mt-2 text-sm text-neutral-700">
                      <Highlight text={snippet} query={query} />
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}