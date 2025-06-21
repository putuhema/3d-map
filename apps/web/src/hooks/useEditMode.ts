import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { useCallback, useState } from "react";

interface UseEditModeProps {
	buildings: Building[];
	onBuildingPlace: (building: Building) => void;
	onBuildingRemove: (id: string) => void;
	onRoomPlace: (room: Room) => void;
	onRoomRemove: (id: string) => void;
	onCorridorDraw: (corridor: Corridor) => void;
	onCorridorRemove: (id: string) => void;
}

export function useEditMode({
	buildings,
	onBuildingPlace,
	onBuildingRemove,
	onRoomPlace,
	onRoomRemove,
	onCorridorDraw,
	onCorridorRemove,
}: UseEditModeProps) {
	const [editMode, setEditMode] = useState(false);
	const [toolMode, setToolMode] = useState<
		"place" | "room" | "corridor" | "remove"
	>("place");
	const [isDrawingCorridor, setIsDrawingCorridor] = useState(false);
	const [corridorStart, setCorridorStart] = useState<
		[number, number, number] | null
	>(null);
	const [buildingName, setBuildingName] = useState("");
	const [buildingSize, setBuildingSize] = useState<[number, number, number]>([
		2, 1, 2,
	]);
	const [buildingColor, setBuildingColor] = useState("#4F46E5");

	const handleGridClick = useCallback(
		(
			x: number,
			y: number,
			gridSize = 100,
			selectedBuildingForRoom?: string | null,
		) => {
			if (toolMode === "place") {
				const centerX = x - (gridSize / 2 - 0.5);
				const centerZ = y - (gridSize / 2 - 0.5);

				const adjustedX = centerX - (buildingSize[0] - 1) / 2;
				const adjustedZ = centerZ - (buildingSize[2] - 1) / 2;

				onBuildingPlace({
					id: crypto.randomUUID(),
					name: buildingName || "New Building",
					position: [adjustedX, 0.5, adjustedZ],
					size: buildingSize,
					color: buildingColor,
				});
			} else if (toolMode === "room") {
				const centerX = x - (gridSize / 2 - 0.5);
				const centerZ = y - (gridSize / 2 - 0.5);

				const adjustedX = centerX - (buildingSize[0] - 1) / 2;
				const adjustedZ = centerZ - (buildingSize[2] - 1) / 2;

				console.log("selectedBuildingForRoom", selectedBuildingForRoom);

				// Find a building to place the room in
				const targetBuilding = selectedBuildingForRoom
					? buildings.find((b) => b.id === selectedBuildingForRoom)
					: buildings.find((b) => b.hasRooms);

				if (!targetBuilding) {
					console.warn("No building available for room placement");
					return;
				}

				onRoomPlace({
					id: crypto.randomUUID(),
					name: buildingName || "New Room",
					position: [adjustedX, 0.5, adjustedZ],
					size: buildingSize,
					color: buildingColor,
					buildingId: targetBuilding.id,
					image: "",
				});
			} else if (toolMode === "corridor") {
				if (!isDrawingCorridor) {
					setCorridorStart([
						x - (gridSize / 2 - 0.5),
						0,
						y - (gridSize / 2 - 0.5),
					]);
					setIsDrawingCorridor(true);
				} else if (corridorStart) {
					onCorridorDraw({
						id: crypto.randomUUID(),
						start: [corridorStart[0], 0, corridorStart[2]],
						end: [x - (gridSize / 2 - 0.5), 0, y - (gridSize / 2 - 0.5)],
						width: 0.3,
					});
					setIsDrawingCorridor(false);
					setCorridorStart(null);
				}
			}
		},
		[
			toolMode,
			buildingSize,
			buildingName,
			buildingColor,
			isDrawingCorridor,
			corridorStart,
			buildings,
			onBuildingPlace,
			onRoomPlace,
			onCorridorDraw,
		],
	);

	const handleBuildingClick = useCallback(
		(id: string, roomId?: string) => {
			if (editMode && toolMode === "remove") {
				if (roomId) {
					onRoomRemove(roomId);
				} else {
					onBuildingRemove(id);
				}
				return;
			}
		},
		[editMode, toolMode, onRoomRemove, onBuildingRemove],
	);

	const handleCorridorRemove = useCallback(
		(id: string) => {
			if (toolMode !== "remove" || !editMode) return;
			onCorridorRemove(id);
		},
		[toolMode, editMode, onCorridorRemove],
	);

	return {
		editMode,
		setEditMode,
		toolMode,
		setToolMode,
		isDrawingCorridor,
		corridorStart,
		setCorridorStart,
		buildingName,
		setBuildingName,
		buildingSize,
		setBuildingSize,
		buildingColor,
		setBuildingColor,
		handleGridClick,
		handleBuildingClick,
		handleCorridorRemove,
	};
}
