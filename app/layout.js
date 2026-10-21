import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { readTheme } from "@/lib/theme";
import { THEMES } from "@/lib/constants";
import Dock from "@/components/Dock";
import SearchDialog from "@/components/SearchDialog";

// next/font haalt het lettertype op tijdens het bouwen en serveert het zelf.
// De browser vraagt dus niets aan Google, en er verspringt geen tekst tijdens
// het laden. variable: het lettertype komt als CSS-variabele beschikbaar,
// en globals.css gebruikt die in --font-sans.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Noteboek",
  description: "Een notitieboek waarin je zelf bepaalt wat je bijhoudt.",
};

export default async function RootLayout({ children }) {
  // Uitgelogd geen dock en geen zoekvenster: er valt niets te zoeken.
  const [user, theme] = await Promise.all([getCurrentUser(), readTheme()]);

  return (
    <html
      lang="nl"
      className={inter.variable}
      // De server zet de gekozen weergave er al in, dus de eerste pagina is
      // meteen goed. Bij "systeem" geen attribuut: dan beslist de browser.
      data-theme={theme === THEMES.SYSTEM ? undefined : theme}
    >
      <body className="min-h-screen bg-ground font-sans text-ink antialiased">
        {children}
        {user && (
          <>
            <Dock />
            <SearchDialog />
          </>
        )}
      </body>
    </html>
  );
}