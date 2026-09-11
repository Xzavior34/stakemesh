import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "StakeMesh | Policy-Driven Solana Stake Allocation",
  description:
    "Open-source infrastructure for diversified, policy-driven Solana stake allocation and rebalancing.",
  metadataBase: new URL("https://stakemesh.example"),
  openGraph: {
    title: "StakeMesh | Policy-Driven Solana Stake Allocation",
    description:
      "Open-source infrastructure for diversified, policy-driven Solana stake allocation and rebalancing.",
    type: "website",
    siteName: "StakeMesh",
  },
  twitter: {
    card: "summary_large_image",
    title: "StakeMesh | Policy-Driven Solana Stake Allocation",
    description:
      "Open-source infrastructure for diversified, policy-driven Solana stake allocation and rebalancing.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

const themeInitScript = `
try {
  var stored = window.localStorage.getItem('stakemesh-theme');
  var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
} catch (e) {
  document.documentElement.setAttribute('data-theme', 'dark');
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
