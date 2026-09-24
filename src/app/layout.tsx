import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { COOKIE_TEMA } from "@/lib/sessao";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Fisioterapia · EC Santo André", template: "%s · Fisioterapia EC Santo André" },
  description: "Registro e acompanhamento da fisioterapia do EC Santo André.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = (await cookies()).get(COOKIE_TEMA)?.value;
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable} ${tema === "escuro" ? "dark" : ""}`}>
      <body className="min-h-dvh font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster
          position="bottom-right"
          duration={3000}
          toastOptions={{
            classNames: {
              toast: "!rounded-lg !border-0 !bg-surface !text-foreground !shadow-overlay !text-base !font-sans",
              description: "!text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
