import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Social Media Manager | IIT Tirupati",
  description: "Enterprise-grade social media content workflow and media management system for IIT Tirupati",
  keywords: ["social media", "content management", "IIT Tirupati", "media upload"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
