import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AppHeader } from "@/presentation/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sudoku Lab: a backtracking Sudoku solver",
  description:
    "Solve Sudoku puzzles with a recursive backtracking algorithm, then replay the search step by step.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/** Runs before first paint so the page never flashes the wrong theme. */
const themeScript = `(function(){try{var k="sudoku-lab-theme",r=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function a(t){r.dataset.theme=t;r.style.colorScheme=t}var s=localStorage.getItem(k);a(s==="light"||s==="dark"?s:m.matches?"dark":"light");m.addEventListener("change",function(e){if(!localStorage.getItem(k))a(e.matches?"dark":"light")})}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="srOnly skipLink">
          Skip to the puzzle
        </a>
        <AppHeader />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
