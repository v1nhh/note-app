import "./globals.css";

export const metadata = {
  title: "Noteboek",
  description: "Een notitieboek waarin je zelf bepaalt wat je bijhoudt.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}