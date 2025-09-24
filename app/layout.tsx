import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IgnisStream - Share Your Epic Gaming Moments",
  description: "The ultimate gaming social platform where players share moments, connect with teammates, and build communities around their favorite games.",
  keywords: "gaming, social media, game clips, gaming community, esports, game moments",
  authors: [{ name: "IgnisStream Team" }],
  openGraph: {
    title: "IgnisStream - Share Your Epic Gaming Moments",
    description: "Join the gaming revolution. Share clips, find teammates, and connect with gamers worldwide.",
    type: "website",
    locale: "en_US",
    siteName: "IgnisStream",
  },
  twitter: {
    card: "summary_large_image",
    title: "IgnisStream - Share Your Epic Gaming Moments",
    description: "Join the gaming revolution. Share clips, find teammates, and connect with gamers worldwide.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
