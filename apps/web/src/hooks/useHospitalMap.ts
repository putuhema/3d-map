import { type Building, buildings as initialBuildings } from "@/data/building";
import { type Corridor, corridors as initialCorridors } from "@/data/corridor";
import { type Room, rooms as initialRooms } from "@/data/room";
import { findCorridorPath } from "@/utils/pathfinding";
import { useCallback, useEffect, useState } from "react";
import { Vector3 } from "three";

export function useHospitalMap() {
	const [viewMode, setViewMode] = useState<"topDown" | "perspective" | "walk">(
		"perspective",
	);
	const [cameraMode, setCameraMode] = useState<"free" | "topDown">("free");
	const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0.6, 15));
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [buildings, setBuildings] = useState<Building[]>(
		() => initialBuildings as Building[],
	);
	const [corridors, setCorridors] = useState<Corridor[]>(
		() => initialCorridors as Corridor[],
	);
	const [rooms, setRooms] = useState<Room[]>(() => initialRooms as Room[]);
	const [toolMode, setToolMode] = useState<
		"place" | "remove" | "corridor" | "room"
	>("room");
	const [isDrawingCorridor, setIsDrawingCorridor] = useState(false);
	const [corridorStart, setCorridorStart] = useState<
		[number, number, number] | null
	>(null);
	const [buildingName, setBuildingName] = useState("");
	const [buildingSize, setBuildingSize] = useState<[number, number, number]>([
		1, 1, 1,
	]);
	const [buildingColor, setBuildingColor] = useState("#4f46e5");
	const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
	const [pathCorridorIds, setPathCorridorIds] = useState<string[]>([]);
	const [directions, setDirections] = useState<string[]>([]);
	const [hoveredCellCoords, setHoveredCellCoords] = useState<{
		x: number;
		y: number;
		z: number;
	} | null>(null);
	const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
		null,
	);
	const [showBuildings, setShowBuildings] = useState(true);
	const [editMode, setEditMode] = useState(false);

	// Load saved state from localStorage
	useEffect(() => {
		const storedBuildings = localStorage.getItem("buildings");
		const storedCorridors = localStorage.getItem("corridors");
		const storedRooms = localStorage.getItem("rooms");
		if (storedBuildings) {
			try {
				setBuildings(JSON.parse(storedBuildings));
			} catch (e) {
				console.warn("Failed to parse stored buildings", e);
			}
		}
		if (storedCorridors) {
			try {
				setCorridors(JSON.parse(storedCorridors));
			} catch (e) {
				console.warn("Failed to parse stored corridors", e);
			}
		}
		if (storedRooms) {
			try {
				setRooms(JSON.parse(storedRooms));
			} catch (e) {
				console.warn("Failed to parse stored rooms", e);
			}
		}
	}, []);

	// Save state to localStorage
	useEffect(() => {
		localStorage.setItem("buildings", JSON.stringify(buildings));
	}, [buildings]);

	useEffect(() => {
		localStorage.setItem("corridors", JSON.stringify(corridors));
	}, [corridors]);

	useEffect(() => {
		localStorage.setItem("rooms", JSON.stringify(rooms));
	}, [rooms]);

	// Helper: Find building by id
	const getBuildingById = useCallback(
		(id: string) => buildings.find((b) => b.id === id),
		[buildings],
	);

	const handleBuildingPlace = (building: Building) => {
		setBuildings((prev) => [...prev, building]);
	};

	const handleBuildingRemove = (id: string) => {
		setBuildings((prev) => prev.filter((b) => b.id !== id));
	};

	const handleRoomRemove = (id: string) => {
		setRooms((prev) => prev.filter((r) => r.id !== id));
	};

	const handleCorridorDraw = (corridor: Corridor) => {
		setCorridors((prev) => [...prev, corridor]);
	};

	const handleCorridorRemove = (id: string) => {
		setCorridors((prev) => prev.filter((c) => c.id !== id));
	};

	const handleRoomPlace = (room: Room) => {
		setRooms((prev) => [...prev, room]);
	};

	const handleGridClick = (x: number, y: number, gridSize = 100) => {
		if (toolMode === "place") {
			const centerX = x - (gridSize / 2 - 0.5);
			const centerZ = y - (gridSize / 2 - 0.5);

			const adjustedX = centerX - (buildingSize[0] - 1) / 2;
			const adjustedZ = centerZ - (buildingSize[2] - 1) / 2;

			handleBuildingPlace({
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

			handleRoomPlace({
				id: crypto.randomUUID(),
				name: buildingName || "New Room",
				position: [adjustedX, 0.5, adjustedZ],
				size: buildingSize,
				color: buildingColor,
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
				handleCorridorDraw({
					id: crypto.randomUUID(),
					start: [corridorStart[0], 0, corridorStart[2]],
					end: [x - (gridSize / 2 - 0.5), 0, y - (gridSize / 2 - 0.5)],
					width: 0.5,
				});
				setIsDrawingCorridor(false);
				setCorridorStart(null);
			}
		}
	};

	const handleBuildingClick = (id: string, roomId?: string) => {
		if (editMode && toolMode === "remove") {
			if (roomId) {
				handleRoomRemove(roomId);
			} else {
				handleBuildingRemove(id);
			}
			return;
		}

		if (selectedBuildings.length === 0) {
			setSelectedBuildings([id]);
			setPathCorridorIds([]);
			setDirections([]);
			return;
		}

		if (selectedBuildings.length === 1) {
			if (selectedBuildings[0] === id) return;
			const first = getBuildingById(selectedBuildings[0]);
			const second = getBuildingById(id);
			if (first && second) {
				const path = findCorridorPath(
					corridors,
					rooms,
					[first.position[0], 0, first.position[2]],
					[second.position[0], 0, second.position[2]],
				);
				setPathCorridorIds(path);
				if (path.length === 0) {
					setDirections(["No path found between the selected buildings."]);
				} else {
					const steps = path.map((pathId, idx) => {
						const corridor = corridors.find((c) => c.id === pathId);
						const room = rooms.find((r) => r.id === pathId);

						if (corridor) {
							const from =
								idx === 0
									? [first.position[0], 0, first.position[2]]
									: [
											corridors.find((c) => c.id === path[idx - 1])?.end[0] ??
												0,
											0,
											corridors.find((c) => c.id === path[idx - 1])?.end[2] ??
												0,
										];
							const to = [corridor.end[0], 0, corridor.end[2]];
							return `Take corridor ${corridor.id} from (${from}) to (${to})`;
						}
						if (room) {
							return `Enter room ${room.name} at position (${room.position})`;
						}
						return "";
					});
					setDirections(steps);
				}
			}
			setSelectedBuildings([]);
			return;
		}

		setSelectedBuildings([id]);
		setPathCorridorIds([]);
		setDirections([]);
	};

	return {
		viewMode,
		setViewMode,
		cameraMode,
		setCameraMode,
		playerPosition,
		setPlayerPosition,
		userLocation,
		setUserLocation,
		locationError,
		setLocationError,
		buildings,
		corridors,
		rooms,
		toolMode,
		setToolMode,
		isDrawingCorridor,
		corridorStart,
		buildingName,
		setBuildingName,
		buildingSize,
		setBuildingSize,
		buildingColor,
		setBuildingColor,
		selectedBuildings,
		pathCorridorIds,
		directions,
		hoveredCellCoords,
		setHoveredCellCoords,
		mousePos,
		setMousePos,
		showBuildings,
		setShowBuildings,
		editMode,
		setEditMode,
		handleGridClick,
		handleBuildingClick,
		handleCorridorRemove,
		setSelectedBuildings,
		setPathCorridorIds,
		setDirections,
	};
}
