import Link from "next/link";
import { requireUser } from "@/lib/session";
import { loadGraph } from "@/lib/graph";
import { ROUTES } from "@/lib/constants";
import Graph from "@/components/Graph";

export const metadata = { title: "Web" };

export default async function GraphPage() {
  const user = await requireUser();
  const { nodes, links, legend } = await loadGraph(user.id);

  return (
    // Breder dan andere pagina's: een web heeft ruimte nodig.
    <main className="page max-w-6xl">
      <h1 className="view-title">Web</h1>
      <p className="mt-2 text-sm text-ink-3">
        Elke lijn is een @verwijzing. Wie vaak genoemd wordt, is groter. Sleep om
        te verschuiven, klik om te openen.
      </p>

      <div className="mt-8">
        {links.length === 0 ? (
          <div className="card text-center">
            <p className="text-ink-2">Nog geen verbindingen.</p>
            <p className="mt-1 text-sm text-ink-3">
              Schrijf in een notitie @ en een naam, dan verschijnt hier je eerste lijn.
            </p>
            <Link href={ROUTES.HOME} className="btn btn-solid mt-4">
              Naar je notities
            </Link>
          </div>
        ) : (
          <Graph nodes={nodes} links={links} legend={legend} />
        )}
      </div>
    </main>
  );
}