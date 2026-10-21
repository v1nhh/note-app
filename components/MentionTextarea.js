"use client";

import { useId, useRef, useState } from "react";
import { MENTION } from "@/lib/constants";

const MAX_SUGGESTIONS = 6;
const MAX_QUERY_LENGTH = 40;
const LETTER = /[\p{L}\p{N}_]/u;

/// Staat de cursor net achter "@iets"? Dan geeft dit de plek van de @ en wat
/// er al getypt is. Anders null.
function findActiveMention(text, caret) {
  const at = text.lastIndexOf(MENTION.TRIGGER, caret - 1);
  if (at === -1) return null;

  // info@sarah.nl: een @ midden in een woord is geen verwijzing.
  const before = at > 0 ? text[at - 1] : "";
  if (LETTER.test(before)) return null;

  const query = text.slice(at + 1, caret);
  if (query.includes("\n") || query.length > MAX_QUERY_LENGTH) return null;

  return { start: at, query };
}

/// Een gewoon tekstvak, met één extra: typ je @, dan verschijnt een lijstje
/// met items. Kiezen zet "@Titel " in de tekst. Het tekstvak stuurt gewoon
/// mee met het formulier; de server zoekt de verwijzingen zelf opnieuw op.
export default function MentionTextarea({
  name,
  defaultValue = "",
  targets,
  excludeId = null,
  className = "",
  ...props
}) {
  const [value, setValue] = useState(defaultValue);
  const [mention, setMention] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef(null);
  const listId = useId();

  const query = mention?.query.toLowerCase() ?? "";
  const suggestions = mention
    ? targets
        .filter((target) => target.id !== excludeId && target.title.toLowerCase().includes(query))
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const open = suggestions.length > 0;
  // Het lijstje kan korter worden terwijl je typt; blijf binnen de grenzen.
  const active = Math.min(activeIndex, suggestions.length - 1);

  // Bij typen én bij het verplaatsen van de cursor opnieuw kijken of je in
  // een @verwijzing staat.
  function refresh(event) {
    const { value: text, selectionStart } = event.target;
    setMention(findActiveMention(text, selectionStart));
  }

  function choose(target) {
    const end = mention.start + 1 + mention.query.length;
    const inserted = `${MENTION.TRIGGER}${target.title} `;
    const next = value.slice(0, mention.start) + inserted + value.slice(end);
    const caret = mention.start + inserted.length;

    setValue(next);
    setMention(null);

    // Na het bijwerken van de tekst de cursor achter de naam zetten.
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(caret, caret);
    });
  }

  function handleKeyDown(event) {
    if (!open) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((active + step + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setMention(null);
    }
  }

  return (
    <div className="relative">
      <textarea
        {...props}
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setActiveIndex(0);
          refresh(event);
        }}
        onSelect={refresh}
        onKeyDown={handleKeyDown}
        onBlur={() => setMention(null)}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        className={`w-full ${className}`}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Verwijzen naar"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-md border border-line bg-card py-1 shadow-lg"
        >
          {suggestions.map((target, index) => (
            <li
              key={target.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown in plaats van click: zo verliest het tekstvak de
              // focus niet en sluit het lijstje niet voordat je kiest.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(target);
              }}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                index === active ? "bg-inset" : ""
              }`}
            >
              <span className="truncate">
                {target.icon ? `${target.icon} ` : ""}
                {target.title}
              </span>
              <span className="shrink-0 text-xs text-ink-3">{target.typeName}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Voor schermlezers: hoeveel voorstellen er zijn. */}
      <p className="sr-only" aria-live="polite">
        {open ? `${suggestions.length} voorstellen, kies met pijltjes en Enter.` : ""}
      </p>
    </div>
  );
}