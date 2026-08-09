import "~/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "subTracker",
  description: "Know what is renewing, and decide what stays.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-paper text-ink font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
