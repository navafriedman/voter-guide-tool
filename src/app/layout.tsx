import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voter Guide Tool",
  description: "Create and share your personalized voter guide with endorsements for local races",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
