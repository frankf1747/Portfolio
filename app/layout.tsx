import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";
import "./styles/globals.scss";

export const metadata: Metadata = {
  title: "Frank Fu — Data · Product · Design",
  description:
    "Frank Fu is a hybrid data analyst, product manager, and UX designer in Los Angeles. Search relevance, causal inference, AI systems — shipped, not just diagrammed."
};

export const viewport: Viewport = {
  themeColor: "#000000"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
