import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Berilis Admin",
  description: "Berilis tasarim yonetim paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Ubuntu:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-inter: 'Inter', sans-serif;
            --font-poppins: 'Poppins', sans-serif;
            --font-ubuntu: 'Ubuntu', sans-serif;
            --font-bricolage: 'Bricolage Grotesque', sans-serif;
          }
          body {
            font-family: var(--font-inter);
          }
        ` }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}