import { Rajdhani, Fira_Code } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});

export const metadata = {
  title: "JARVIS | Advanced AI Interface",
  description: "Next-generation voice controlled personal assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${rajdhani.variable} ${firaCode.variable} antialiased font-sans`}
      >
        <div className="scan-line"></div>
        {children}
      </body>
    </html>
  );
}
