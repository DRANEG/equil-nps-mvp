import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EQUIL", template: "%s · EQUIL" },
  description: "Colectezi feedback de la clienți, vezi scorul NPS pe fiecare locație și transformi fiecare nemulțumire într-o acțiune concretă.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        {/* Fonturile vor fi gazduite local inainte de lansare (GDPR). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
