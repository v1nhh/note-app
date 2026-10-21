"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quickSearch } from "@/app/search-actions";
import { ROUTES, SEARCH_PARAMS } from "@/lib/constants";
import Highlight from "@/components/Highlight";

/// Hoe lang je mag stilvallen voordat er gezocht wordt. Zo vraag je niet bij
/// elke letter de server, maar pas als je even pauzeert.
const DEBOUNCE_MS = 200;

/// Het ⌘K-venster. Een <dialog> met showModal(): de browser zet de rest van
/// de pagina dan buiten bereik, houdt de focus in het venster, sluit met Esc
/// en zet de focus daarna terug waar hij was. Dat hoeven we niet zelf te doen.
export default function SearchDialog() {
  const router = useRouter();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  // Elke zoekopdracht krijgt een nummer. Komt een oud antwoord later binnen
  // dan een nieuw, dan negeren we het: anders zie je resultaten voor "ko"
  // terwijl je al "koffie" hebt getypt.
  const latestRef = useRef(0);
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ recent: true, results: [] });
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const results = data.results;

  function runSearch(text, delay) {
    clearTimeout(timerRef.current);
    const requestId = ++latestRef.current;
    setLoading(true);

    timerRef.current = setTimeout(async () => {
      try {
        const next = await quickSearch(text);
        if (requestId !== latestRef.current) return;
        setData(next);
        setActive(0);
      } finally {
        if (requestId === latestRef.current) setLoading(false);
      }
    }, delay);
  }

  function openSearch() {
    setQuery("");
    setOpen(true);
    // Leeg zoekwoord: meteen de laatste stukken laten zien.
    runSearch("", 0);
  }

  function closeSearch() {
    clearTimeout(timerRef.current);
    setOpen(false);
  }

  function go(result) {
    closeSearch();
    router.push(result.href);
  }

  // ⌘K of Ctrl+K: openen, of sluiten als hij al open is. useEffectEvent:
  // de listener ziet altijd de nieuwste versie van deze functie, zonder dat
  // hij bij elke render opnieuw aangemeld hoeft te worden.
  const onShortcut = useEffectEvent((event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (open) closeSearch();
      else openSearch();
    }
  });

  useEffect(() => {
    const listener = (event) => onShortcut(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // De state "open" en het echte venster gelijk houden.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleKeyDown(event) {
    if (results.length === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((active + step + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  }

  const fullSearch = `${ROUTES.SEARCH}?${new URLSearchParams({ [SEARCH_PARAMS.QUERY]: query })}`;

  return (
    <dialog
      ref={dialogRef}
      // Esc sluit de dialog in de browser zelf; dan ook de state bijwerken.
      onClose={() => setOpen(false)}
      // Klik op de donkere achtergrond (de dialog zelf, buiten de inhoud): sluiten.
      onClick={(event) => {
        if (event.target === dialogRef.current) closeSearch();
      }}
      aria-label="Zoeken"
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100%-2rem))] overflow-hidden rounded-2xl bg-card text-ink shadow-2xl backdrop:bg-black/40"
    >
      <div className="border-b border-line p-4">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            runSearch(event.target.value, DEBOUNCE_MS);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Zoek in notities, mensen, boeken…"
          aria-label="Zoekwoord"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? `${listId}-${active}` : undefined}
          className="w-full bg-transparent text-lg outline-none"
        />
      </div>

      <p className="section-label px-4 pt-3">
        {loading ? "Zoeken…" : data.recent ? "Recent" : `${results.length} gevonden`}
      </p>

      <ul id={listId} role="listbox" aria-label="Resultaten" className="max-h-[50vh] overflow-auto p-2">
        {results.map((result, index) => (
          <li
            key={result.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseEnter={() => setActive(index)}
            onClick={() => go(result)}
            className={`cursor-pointer rounded-lg px-3 py-2 ${index === active ? "bg-inset" : ""}`}
          >
            <p className="flex items-center justify-between gap-3">
              <span className="truncate font-medium">
                {result.icon ? `${result.icon} ` : ""}
                <Highlight text={result.title} query={query} />
              </span>
              <span className="shrink-0 text-xs text-ink-3">{result.typeName}</span>
            </p>
            {result.snippet && (
              <p className="mt-0.5 truncate text-sm text-ink-3">
                <Highlight text={result.snippet} query={query} />
              </p>
            )}
          </li>
        ))}

        {!loading && results.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-ink-3">
            {data.recent ? "Nog niets opgeschreven." : `Niets gevonden voor "${query.trim()}".`}
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-xs text-ink-3">
        <span>↑↓ kiezen · ↵ openen · esc sluiten</span>
        {query.trim() && (
          <a
            href={fullSearch}
            onClick={(event) => {
              event.preventDefault();
              closeSearch();
              router.push(fullSearch);
            }}
            className="font-medium text-ink hover:underline"
          >
            Alle resultaten
          </a>
        )}
      </div>
    </dialog>
  );
}