import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ROI Intelligence | Test Automation Dashboard",
  description: "Strategy matrix for engineering overhead vs pipeline execution gains",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        {children}
      </body>
    </html>
  );
}