import { Header } from "@/components/Header";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fourth Code — Private Gyms, Hosted by Locals | KEEP MOVING.",
  description:
    "Fourth Code is the marketplace for private gyms. Hosts list their garage and home gyms; Athletes book them by the hour. Kansas City first.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <footer>
          <div className="container">
            <p>
              FOURTH CODE — KEEP MOVING.
              <br />
              Private gyms, hosted by locals. Kansas City first.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
