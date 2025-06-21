import { Html } from "@react-three/drei";

interface RoomLabelProps {
	roomName: string;
	position: [number, number, number];
	rotation?: [number, number, number];
	isDestination: boolean;
	isFromDestination: boolean;
}

export function RoomLabel({
	roomName,
	position,
	rotation,
	isDestination,
	isFromDestination,
}: RoomLabelProps) {
	return (
		<Html
			zIndexRange={[1, 0]}
			center
			position={position}
			rotation={rotation}
			style={{
				background: isDestination
					? isFromDestination
						? "#D1D8BE"
						: "#80D8C3"
					: "#FF6F3C",
				color: "white",
				padding: "8px 12px",
				borderRadius: "6px",
				fontSize: "12px",
				whiteSpace: "nowrap",
				pointerEvents: "none",
				fontWeight: isDestination ? "bold" : "normal",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
				border: "1px solid rgba(255, 255, 255, 0.2)",
				position: "relative",
				transform: "translateY(-8px)",
			}}
		>
			{isDestination
				? `${roomName} (${isFromDestination ? "FROM" : "TO"})`
				: roomName}
			<div
				style={{
					position: "absolute",
					top: "100%",
					left: "50%",
					transform: "translateX(-50%)",
					width: "0",
					height: "0",
					borderLeft: "6px solid transparent",
					borderRight: "6px solid transparent",
					borderTop: isDestination
						? isFromDestination
							? "#D1D8BE"
							: "#80D8C3"
						: "#FF6F3C",
				}}
			/>
		</Html>
	);
}
