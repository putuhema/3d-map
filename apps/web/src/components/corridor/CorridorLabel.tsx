import { Html } from "@react-three/drei";

interface CorridorLabelProps {
	label: string;
	position: [number, number, number];
	rotation?: [number, number, number];
}

export function CorridorLabel({
	label,
	position,
	rotation,
}: CorridorLabelProps) {
	return (
		<Html
			zIndexRange={[1, 0]}
			center
			position={position}
			rotation={rotation}
			style={{
				position: "relative",
				textAlign: "left",
				background: "#22d3ee",
				color: "white",
				padding: "10px 15px",
				borderRadius: "5px",
				fontSize: "12px",
				whiteSpace: "nowrap",
				pointerEvents: "none",
				fontWeight: "bold",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
				border: "1px solid rgba(255, 255, 255, 0.2)",
			}}
		>
			{label}
			<div
				style={{
					position: "absolute",
					top: "100%",
					left: "50%",
					transform: "translateX(-50%)",
					height: "40px",
					width: "1px",
					background: "#22d3ee",
				}}
			/>
		</Html>
	);
}
