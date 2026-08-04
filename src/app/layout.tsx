import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
	metadataBase: new URL(SITE_URL),
	title: {
		default: SITE_NAME,
		template: `%s · ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: [
		"weather",
		"canvas",
		"Better Weather",
		"live weather",
		"frost",
		"rain",
		"globe",
	],
	authors: [{ name: "Youssef Rabei", url: "https://github.com/YoussefRabeiii" }],
	creator: "Youssef Rabei",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "/",
		siteName: SITE_NAME,
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
	},
	robots: {
		index: true,
		follow: true,
	},
	category: "weather",
};

export const viewport: Viewport = {
	themeColor: "#0a0e14",
	colorScheme: "dark",
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
