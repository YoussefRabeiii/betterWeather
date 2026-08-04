import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["500", "600", "700"],
});

const sans = Manrope({
	variable: "--font-sans",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Better Weather",
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
			className={`${display.variable} ${sans.variable} h-dvh antialiased`}
			style={{ backgroundColor: "#0a0e14", colorScheme: "dark" }}>
			<body
				className="h-dvh overflow-hidden font-sans"
				style={{ backgroundColor: "#0a0e14" }}>
				{children}
			</body>
		</html>
	);
}
