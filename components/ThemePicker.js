"use client";

import { useState } from "react";
import { setTheme } from "@/app/preference-actions";
import { THEMES, THEME_LABELS } from "@/lib/constants";

/// Drie keuzes naast elkaar: Systeem, Licht, Donker. Echte radioknoppen (met
/// sr-only verstopt), zodat pijltjestoetsen en schermlezers vanzelf werken.
export default function ThemePicker({ initialTheme }) {
  const [theme, setChosen] = useState(initialTheme);

  function choose(next) {
    setChosen(next);

    // Meteen toepassen, zonder op de server te wachten: globals.css kijkt
    // naar data-theme op <html>. Bij "systeem" halen we het weg.
    const root = document.documentElement;
    if (next === THEMES.SYSTEM) delete root.dataset.theme;
    else root.dataset.theme = next;

    // Daarna onthouden voor de volgende pagina.
    setTheme(next);
  }

  return (
    <fieldset>
      <legend className="sr-only">Weergave</legend>
      <div className="inline-flex gap-1 rounded-full bg-inset p-1">
        {Object.values(THEMES).map((value) => (
          <label
            key={value}
            className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-ink-3 transition-colors hover:text-ink has-checked:bg-action has-checked:text-action-text has-focus-visible:outline-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => choose(value)}
              className="sr-only"
            />
            {THEME_LABELS[value]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}