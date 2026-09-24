import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { COOKIE_TEMA } from "@/lib/sessao";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Fisioterapia · EC Santo André", template: "%s · Fisioterapia EC Santo André" },
  description: "Registro e acompanhamento da fisioterapia do EC Santo André.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = (await cookies()).get(COOKIE_TEMA)?.value;
  return (
    <html lang="pt-BR" className={`${inter.variable} ${tema === "escuro" ? "dark" : ""}`}>
      <body className="min-h-dvh font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster
          position="bottom-right"
          duration={3000}
          toastOptions={{
            classNames: {
              toast: "!rounded-md !border !border-border !bg-surface !text-foreground !shadow-overlay !text-base !font-sans",
              description: "!text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
