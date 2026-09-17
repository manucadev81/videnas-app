import type { Metadata } from "next";
import { Inter, Quicksand, Roboto_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--font-family-sans",
});

const quicksand = Quicksand({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--font-family-display",
  weight: ["400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--font-family-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Videnas — Conformidade regulatória para criptoativos",
  description:
    "Plataforma RegTech que estrutura, valida e audita os arquivos regulatórios ACAM212, Cadoc 5710/5711 e Fiscal (DPS) para instituições brasileiras de criptoativos, do dado bruto ao arquivo pronto para o Banco Central.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${quicksand.variable} ${robotoMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-left"
          mobileOffset={{ bottom: "6rem", left: "1rem", right: "1rem" }}
        />
      </body>
    </html>
  );
}
