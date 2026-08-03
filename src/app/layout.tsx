import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const display = Fraunces({
	variable: "--font-display",
	subsets: ["latin"],
});

const sans = Manrope({
	variable: "--font-sans",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "betterWeather",
	description:
		"A canvas-powered weather experience — live conditions as Flame, Frost, Droplets, Clouds, Cloth, and Blaze.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${display.variable} ${sans.variable} h-dvh antialiased`}>
			<body className="h-dvh overflow-hidden font-sans">{children}</body>
		</html>
	);
}
