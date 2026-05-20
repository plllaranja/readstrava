import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "ReadStrava — Rastreie sua leitura",
  description: "O app de rastreamento de leituras com alma de rede social",
  themeColor: "#FC5200",
  openGraph: {
    title: "ReadStrava",
    description: "Rastreie suas leituras como um atleta",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-[#F7F7FA] text-[#353633] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
