import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — canvas-powered live weather`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EFFECTS = ["Blaze", "Flame", "Frost", "Droplets", "Clouds", "Cloth"];

export default function OpenGraphImage() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "72px 80px",
					background:
						"radial-gradient(ellipse 140% 100% at 50% -10%, #5a6a7c 0%, #2e3a4a 38%, #161e28 72%, #0a0e14 100%)",
					color: "#f2f6fa",
					fontFamily:
						'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
				}}>
				{/* Soft glow accents */}
				<div
					style={{
						position: "absolute",
						top: -80,
						right: -40,
						width: 420,
						height: 420,
						borderRadius: 999,
						background:
							"radial-gradient(circle, rgba(232,240,248,0.18) 0%, rgba(232,240,248,0) 70%)",
						display: "flex",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: -120,
						left: -60,
						width: 480,
						height: 480,
						borderRadius: 999,
						background:
							"radial-gradient(circle, rgba(120,160,200,0.16) 0%, rgba(120,160,200,0) 70%)",
						display: "flex",
					}}
				/>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 14,
						fontSize: 28,
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "#c2cedc",
					}}>
					<div
						style={{
							width: 14,
							height: 14,
							borderRadius: 999,
							background: "#e8f0f8",
							boxShadow: "0 0 24px rgba(232,240,248,0.7)",
							display: "flex",
						}}
					/>
					Live canvas weather
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div
						style={{
							fontSize: 92,
							fontWeight: 700,
							letterSpacing: "-0.04em",
							lineHeight: 1.02,
							color: "#f7fafc",
						}}>
						{SITE_NAME}
					</div>
					<div
						style={{
							maxWidth: 860,
							fontSize: 34,
							fontWeight: 500,
							lineHeight: 1.35,
							color: "#c2cedc",
						}}>
						{SITE_DESCRIPTION}
					</div>
				</div>

				<div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
					{EFFECTS.map((effect) => (
						<div
							key={effect}
							style={{
								display: "flex",
								alignItems: "center",
								padding: "12px 22px",
								borderRadius: 999,
								border: "1px solid rgba(220,230,245,0.28)",
								background: "rgba(12,18,26,0.72)",
								color: "#e8f0f8",
								fontSize: 24,
								fontWeight: 600,
							}}>
							{effect}
						</div>
					))}
				</div>
			</div>
		),
		{ ...size },
	);
}
