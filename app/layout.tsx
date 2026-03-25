import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import AchievementProvider from "@/components/achievements/AchievementProvider";
import HashtagProvider from "@/components/hashtags/HashtagProvider";
import NotificationProvider from "@/components/notifications/NotificationProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
  preload: true,
});

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
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <HashtagProvider>
                  <AchievementProvider>
                    {children}
                    <Toaster />
                  </AchievementProvider>
                </HashtagProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
