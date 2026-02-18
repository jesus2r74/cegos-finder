import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cegos Course Finder | Recomendador de Formaci\u00f3n",
  description: "Encuentra la formaci\u00f3n ideal de Cegos y FranklinCovey para las necesidades de tu empresa. Busca por competencias, retos o \u00e1reas de mejora.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
