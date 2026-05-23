import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";
import TopLoaderWrapper from "@/components/wrappers/toploader-wrapper";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "@/constants";

const loraHeading = Lora({ subsets: ['latin'], variable: '--font-heading' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, loraHeading.variable, geistSans.className)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <TooltipProvider>
          <ThemeProvider attribute="class">
            <ReactQueryProvider>
              <TopLoaderWrapper>
                {children}
              </TopLoaderWrapper>
            </ReactQueryProvider>
          </ThemeProvider>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
