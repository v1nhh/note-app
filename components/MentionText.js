import { Fragment } from "react";
import Link from "next/link";
import { splitMentions } from "@/lib/mentions";
import { itemHref } from "@/lib/links";

/// Toont een tekst waarin elke @verwijzing een link is naar het genoemde item.
/// targets: [{ id, title, typeName }].
export default function MentionText({ text, targets }) {
  return splitMentions(text, targets).map((part, index) =>
    part.target ? (
      <Link
        key={index}
        href={itemHref(part.target.id, part.target.typeName)}
        className="font-medium text-link hover:underline"
      >
        {part.text}
      </Link>
    ) : (
      <Fragment key={index}>{part.text}</Fragment>
    ),
  );
}