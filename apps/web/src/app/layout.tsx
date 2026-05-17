import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import ChatbotWidget from "@/features/chatbot/chatbot-widget";

export const metadata: Metadata = {
  title: "Raycraft AI ERP",
  description: "Faculty and admin workspace for Raycraft AI ERP"
};

/** Viewport — required for mobile-responsive scaling. Without this Safari/Chrome
 *  default to 980 px and zoom out, making the app unusable on phones. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
