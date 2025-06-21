import { Html } from "@react-three/drei";

interface RoomLabelProps {
	roomName: string;
	position: [number, number, number];
	isDestination: boolean;
	isFromDestination: boolean;
}

export function RoomLabel({
	roomName,
	position,
	isDestination,
	isFromDestination,
}: RoomLabelProps) {
	return (
		<Html
			center
			position={position}
			style={{
				background: isDestination
					? isFromDestination
						? "rgba(34, 197, 94, 0.9)"
						: "rgba(239, 68, 68, 0.9)"
					: "#23302b",
				color: "white",
				padding: "4px 8px",
				borderRadius: "4px",
				fontSize: "14px",
				whiteSpace: "nowrap",
				pointerEvents: "none",
				fontWeight: isDestination ? "bold" : "normal",
			}}
		>
			{isDestination
				? `${roomName} (${isFromDestination ? "FROM" : "TO"})`
				: roomName}
		</Html>
	);
}
