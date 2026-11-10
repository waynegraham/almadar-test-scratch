import type { Metadata } from "next";
import "./globals.css";
import { EnvironmentSwitcher } from "@/components/environment-switcher";
import { getRequestEnvironment } from "@/server/environment";

export const metadata: Metadata = {
  title: "Almadar Works Viewer",
  description: "Thumbnail viewer for published Almadar works.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { environment, config } = await getRequestEnvironment();
  return (
    <html lang="en" className="h-full antialiased">
      <body data-environment={environment} className="min-h-full flex flex-col">
        <EnvironmentSwitcher environment={environment} cmsUrl={config.strapiBaseUrl} />
        {children}
      </body>
    </html>
  );
}
