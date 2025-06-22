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
				position: "relative",
				textAlign: "left",
				background: isDestination
					? isFromDestination
						? "#D1D8BE"
						: "#80D8C3"
					: "#FF6F3C",
				color: "white",
				padding: "10px 15px",
				borderRadius: "5px",
				fontSize: "12px",
				whiteSpace: "nowrap",
				pointerEvents: "none",
				fontWeight: isDestination ? "bold" : "normal",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
				border: "1px solid rgba(255, 255, 255, 0.2)",
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
					height: "40px",
					width: "1px",
					background: isDestination
						? isFromDestination
							? "#D1D8BE"
							: "#80D8C3"
						: "#FF6F3C",
				}}
			/>
		</Html>
	);
}
