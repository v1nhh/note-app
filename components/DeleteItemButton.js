"use client";

import { deleteItem } from "@/app/item-actions";
import { ITEM_FORM } from "@/lib/constants";

/// Verwijderen is niet terug te draaien, dus eerst vragen. Wordt het item
/// ergens genoemd, dan zegt de vraag dat erbij: die verwijzingen worden
/// gewone tekst.
export default function DeleteItemButton({ id, title, mentionedCount = 0 }) {
  function confirmDelete(event) {
    const warning =
      mentionedCount > 0
        ? ` Het wordt genoemd in ${mentionedCount} ${mentionedCount === 1 ? "stuk" : "stukken"}; daar wordt @${title} gewone tekst.`
        : "";
    const sure = window.confirm(`"${title}" verwijderen?${warning} Dit kun je niet ongedaan maken.`);
    // preventDefault stopt het versturen: de server action wordt niet
    // aangeroepen.
    if (!sure) event.preventDefault();
  }

  return (
    <form action={deleteItem} onSubmit={confirmDelete}>
      <input type="hidden" name={ITEM_FORM.ID} value={id} />
      <button
        type="submit"
        className="rounded-md border border-danger-line px-4 py-2 text-sm text-danger hover:bg-danger-soft"
      >
        Verwijderen
      </button>
    </form>
  );
}