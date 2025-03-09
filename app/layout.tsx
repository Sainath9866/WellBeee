import "./css/style.css";

import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { AuthProvider } from './providers';
import Header from "@/components/ui/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const nacelle = localFont({
  src: [
    {
      path: "../public/fonts/nacelle-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/nacelle-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-nacelle",
  display: "swap",
});

export const metadata = {
  title: "HealthTech",
  description: "A comprehensive health and wellness platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let isDark = true;
                const storedTheme = localStorage.getItem('theme')
                if (storedTheme === 'light') {
                  isDark = false;
                  document.documentElement.classList.remove('dark')
                  document.documentElement.classList.add('light')
                } else {
                  document.documentElement.classList.remove('light')
                  document.documentElement.classList.add('dark')
                }
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${nacelle.variable} font-inter text-base antialiased dark:text-gray-200 light:text-gray-900`}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip dark:bg-gray-950 light:bg-white">
            <Header />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
