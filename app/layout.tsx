import type { Metadata, Viewport } from "next";
import { Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { themeInitScript } from "@/components/providers/ThemeProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowTask — FlowSys LT",
  description: "Plataforma organizacional gamificada de Lucas e Thaiane.",
};

export const viewport: Viewport = {
  themeColor: "#ad88ed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${poppins.variable} ${montserrat.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
