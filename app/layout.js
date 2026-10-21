import { Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

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

export default function RootLayout({ children }) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="min-h-screen bg-ground font-sans text-ink antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}