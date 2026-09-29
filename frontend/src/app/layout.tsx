import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogQL — Compiler-Based Log Query & Optimization Engine",
  description: "A B.Tech Compiler Design Mini Project demonstrating Lexing, Parsing, Semantic Analysis, AST Optimizations, and Volcano Execution over structured server logs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-bg text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
