import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "RV Trust AI ERP",
  description: "Faculty and admin workspace for RV Trust AI ERP"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try { session = await auth(); } catch (e) { console.warn('[EdAI] Auth unavailable during build:', e); }
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
