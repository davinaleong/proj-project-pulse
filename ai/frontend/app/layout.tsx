import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Project Pulse AI",
  description:
    "An AI-powered assistant and analytics dashboard for exploring project insights, tech stacks, timelines, and performance trends — powered by Azure OpenAI and Azure AI Search.",
  keywords: [
    "Project Pulse",
    "AI chatbot",
    "Azure OpenAI",
    "Azure AI Search",
    "dashboard",
    "project analytics",
    "Next.js",
    "TypeScript"
  ],
  authors: [{ name: "Davina Leong" }],
  creator: "Davina Leong",
  applicationName: "Project Pulse AI",
  openGraph: {
    title: "Project Pulse AI",
    description:
      "AI-assisted project insights powered by Azure OpenAI and Azure AI Search.",
    url: "https://your-domain.com",
    siteName: "Project Pulse AI",
    locale: "en_SG",
    type: "website"
  }
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
