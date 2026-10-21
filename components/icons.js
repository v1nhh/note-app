// Iconen als kleine SVG's, zonder bibliotheek. stroke="currentColor": een
// icoon heeft de kleur van de tekst eromheen, en wisselt dus vanzelf mee met
// licht en donker. aria-hidden: het label naast het icoon zegt al wat het is,
// een schermlezer hoeft het icoon niet voor te lezen.

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconNotes() {
  return (
    <Icon>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6M10 17h4" />
    </Icon>
  );
}

export function IconTypes() {
  return (
    <Icon>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Icon>
  );
}

export function IconGraph() {
  return (
    <Icon>
      <circle cx="6" cy="7" r="2.5" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="17" r="3" />
      <path d="m8.2 8.4 2.4 6M16.6 7.6l-3.2 7M8.4 6.8l7.6-.6" />
    </Icon>
  );
}

export function IconSearch() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Icon>
  );
}

export function IconSettings() {
  return (
    <Icon>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </Icon>
  );
}