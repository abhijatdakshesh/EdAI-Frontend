import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import ChatbotWidget from "@/features/chatbot/chatbot-widget";

export const metadata: Metadata = {
  title: "RV Trust AI ERP",
  description: "Faculty and admin workspace for RV Trust AI ERP"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try { session = await auth(); } catch (e) { console.warn('[Ed8AI] Auth unavailable during build:', e); }
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <Providers>{children}</Providers>
          <ChatbotWidget />
        </SessionProvider>
      </body>
    </html>
  );
}
