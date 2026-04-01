import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Takilla — Boletos para tu ciudad",
  description: "Adquiere y vende boletos para eventos locales",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} h-full antialiased`}
      style={{ background: '#140a2a' }}
    >
      <body className="min-h-full flex flex-col" style={{ background: '#140a2a', color: '#f4f1ff' }}>
        {children}
      </body>
    </html>
  );
}