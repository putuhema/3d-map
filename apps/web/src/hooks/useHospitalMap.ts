import { type Building, buildings as initialBuildings } from "@/data/building";
import { type Corridor, corridors as initialCorridors } from "@/data/corridor";
import { type Room, rooms as initialRooms } from "@/data/room";
import { findCorridorPath } from "@/utils/pathfinding";
import { useCallback, useEffect, useState } from "react";
import { Vector3 } from "three";

export function useHospitalMap() {
	const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0.6, 15));
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [buildings, setBuildings] = useState<Building[]>(
		initialBuildings as Building[],
	);
	const [corridors, setCorridors] = useState<Corridor[]>(
		initialCorridors as Corridor[],
	);
	const [rooms, setRooms] = useState<Room[]>(initialRooms as Room[]);
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
	const [showRooms, setShowRooms] = useState(true);
	const [selectedBuildingForRoom, setSelectedBuildingForRoom] = useState<
		string | null
	>(null);

	// Destination selector state
	const [fromId, setFromId] = useState<string | null>(null);
	const [toId, setToId] = useState<string | null>(null);

	// Room dialog state
	const [roomDialogOpen, setRoomDialogOpen] = useState(false);
	const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

	// Location dialog state (for both rooms and buildings)
	const [locationDialogOpen, setLocationDialogOpen] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState<
		Room | Building | null
	>(null);

	// Selection state for outline display
	const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
		null,
	);
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

	// Destination selector state
	const [destinationSelectorExpanded, setDestinationSelectorExpanded] =
		useState(false);

	// Camera target state for auto-zoom
	const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
		0, 0, 6,
	]);

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

	// Helper: Find room by id
	const getRoomById = useCallback(
		(id: string) => rooms.find((r) => r.id === id),
		[rooms],
	);

	// Helper: Get position from building or room id
	const getPositionById = useCallback(
		(id: string): [number, number, number] | null => {
			const building = getBuildingById(id);
			if (building) {
				return building.position;
			}
			const room = getRoomById(id);
			if (room) {
				return room.position;
			}
			return null;
		},
		[getBuildingById, getRoomById],
	);

	// Function to calculate camera target for two selected rooms
	const calculateCameraTargetForRooms = useCallback(() => {
		// Only auto-zoom if both fromId and toId are set
		if (!fromId || !toId) return;

		let fromPos: [number, number, number] | null = null;
		let toPos: [number, number, number] | null = null;

		// Handle current location case
		if (fromId === "current") {
			fromPos = [playerPosition.x, 0, playerPosition.z];
		} else {
			const fromRoom = getRoomById(fromId);
			if (fromRoom) {
				fromPos = fromRoom.position;
			}
		}

		// Handle destination (can be room or building)
		const toRoom = getRoomById(toId);
		const toBuilding = getBuildingById(toId);

		if (toRoom) {
			toPos = toRoom.position;
		} else if (toBuilding) {
			toPos = toBuilding.position;
		}

		// Only proceed if we have both positions
		if (!fromPos || !toPos) return;

		// Calculate the direction vector from "from" to "to" destination
		const directionX = toPos[0] - fromPos[0];
		const directionZ = toPos[2] - fromPos[2];

		// Calculate the center point between the two positions
		const centerX = (fromPos[0] + toPos[0]) / 2;
		const centerY = (fromPos[1] + toPos[1]) / 2;
		const centerZ = (fromPos[2] + toPos[2]) / 2;

		// Calculate the distance between the positions to determine appropriate zoom
		const distanceX = Math.abs(toPos[0] - fromPos[0]);
		const distanceZ = Math.abs(toPos[2] - fromPos[2]);
		const maxDistance = Math.max(distanceX, distanceZ);

		// Add some padding to the target (1.5x the distance)
		const padding = Math.max(maxDistance * 1.5, 3); // Minimum padding of 3 units

		// Calculate the normalized direction vector
		const directionLength = Math.sqrt(
			directionX * directionX + directionZ * directionZ,
		);
		const normalizedDirectionX =
			directionLength > 0 ? directionX / directionLength : 0;
		const normalizedDirectionZ =
			directionLength > 0 ? directionZ / directionLength : 0;

		// Offset the camera target to position "from" at bottom and "to" at top
		// Move the target slightly towards the "from" position so it appears at the bottom
		const offsetDistance = maxDistance * 0.25; // 25% of the distance between destinations
		const offsetX = centerX - normalizedDirectionX * offsetDistance;
		const offsetZ = centerZ - normalizedDirectionZ * offsetDistance;

		// Set the camera target to the offset center
		setCameraTarget([offsetX, centerY, offsetZ]);

		// Return the calculated target and distance for zoom adjustment
		return {
			target: [offsetX, centerY, offsetZ] as [number, number, number],
			distance: padding,
		};
	}, [fromId, toId, getRoomById, getBuildingById, playerPosition]);

	// Effect to recalculate camera target when room selection changes
	useEffect(() => {
		calculateCameraTargetForRooms();
	}, [fromId, toId]);

	// Destination selector functions
	const handleFromSelect = useCallback(
		(id: string, type: "building" | "room") => {
			setFromId(id);
			setSelectedBuildings([]);
			setPathCorridorIds([]);
			setDirections([]);
		},
		[],
	);

	const handleToSelect = useCallback(
		(id: string, type: "building" | "room") => {
			setToId(id);
			setSelectedBuildings([]);
			setPathCorridorIds([]);
			setDirections([]);

			// Show location dialog for both rooms and buildings
			if (type === "room") {
				const room = getRoomById(id);
				if (room) {
					setSelectedLocation(room);
					setLocationDialogOpen(true);
				}
			} else if (type === "building") {
				const building = getBuildingById(id);
				if (building) {
					setSelectedLocation(building);
					setLocationDialogOpen(true);
				}
			}
		},
		[getRoomById, getBuildingById],
	);

	const handleUseCurrentLocation = useCallback(() => {
		setFromId("current");
		setSelectedBuildings([]);
		setPathCorridorIds([]);
		setDirections([]);
	}, []);

	const handleFindPath = useCallback(() => {
		if (!fromId || !toId || fromId === toId) return;

		let fromPos: [number, number, number] | null = null;

		if (fromId === "current") {
			// Use current player position
			fromPos = [playerPosition.x, 0, playerPosition.z];
		} else {
			fromPos = getPositionById(fromId);
		}

		const toPos = getPositionById(toId);

		if (fromPos && toPos) {
			const path = findCorridorPath(
				corridors,
				rooms,
				[fromPos[0], 0, fromPos[2]],
				[toPos[0], 0, toPos[2]],
			);
			setPathCorridorIds(path);
			if (path.length === 0) {
				setDirections(["No path found between the selected locations."]);
			} else {
				const steps = path.map((pathId, idx) => {
					const corridor = corridors.find((c) => c.id === pathId);
					const room = rooms.find((r) => r.id === pathId);

					if (corridor) {
						const from =
							idx === 0
								? [fromPos[0], 0, fromPos[2]]
								: [
										corridors.find((c) => c.id === path[idx - 1])?.end[0] ?? 0,
										0,
										corridors.find((c) => c.id === path[idx - 1])?.end[2] ?? 0,
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
	}, [fromId, toId, getPositionById, corridors, rooms, playerPosition]);

	const handleRoomDialogClose = useCallback(() => {
		// Close the destination selector
		setDestinationSelectorExpanded(false);
		// Trigger pathfinding when location dialog closes
		if (fromId && toId && fromId !== toId) {
			handleFindPath();
		}
	}, [fromId, toId, handleFindPath]);

	// Reset function to clear navigation and tracking
	const handleReset = useCallback(() => {
		setSelectedBuildings([]);
		setPathCorridorIds([]);
		setDirections([]);
		setFromId(null);
		setToId(null);
		setDestinationSelectorExpanded(false);
		setLocationDialogOpen(false);
		setSelectedLocation(null);
	}, []);

	const handleBuildingPlace = (building: Building) => {
		// Set hasRooms to false by default for new buildings
		const newBuilding = {
			...building,
			hasRooms: false,
		};
		setBuildings((prev) => [...prev, newBuilding]);
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
		if (toolMode !== "remove" || !editMode) return;
		setCorridors((prev) => prev.filter((c) => c.id !== id));
		if (pathCorridorIds.includes(id)) {
			setPathCorridorIds([]);
			setDirections([]);
		}
	};

	const handleRoomPlace = (room: Room) => {
		// If no building is selected for room placement, use the first building with hasRooms=true
		if (!room.buildingId) {
			const buildingWithRooms = buildings.find((b) => b.hasRooms);
			if (buildingWithRooms) {
				room.buildingId = buildingWithRooms.id;
			} else {
				console.warn("No building available for room placement");
				return;
			}
		}
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

			// Find a building to place the room in
			const targetBuilding = selectedBuildingForRoom
				? buildings.find((b) => b.id === selectedBuildingForRoom)
				: buildings.find((b) => b.hasRooms);

			if (!targetBuilding) {
				console.warn("No building available for room placement");
				return;
			}

			handleRoomPlace({
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
				handleCorridorDraw({
					id: crypto.randomUUID(),
					start: [corridorStart[0], 0, corridorStart[2]],
					end: [x - (gridSize / 2 - 0.5), 0, y - (gridSize / 2 - 0.5)],
					width: 0.8,
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

		// Show location dialog for the clicked building or room
		if (roomId) {
			// Clicked on a room
			const room = getRoomById(roomId);
			if (room) {
				setSelectedLocation(room);
				setLocationDialogOpen(true);
			}
		} else {
			// Clicked on a building
			const building = getBuildingById(id);
			if (building) {
				setSelectedLocation(building);
				setLocationDialogOpen(true);
			}
		}

		// Original pathfinding logic (keep for backward compatibility)
		if (selectedBuildings.length === 0) {
			setSelectedBuildings([id]);
			setPathCorridorIds([]);
			setDirections([]);
			return;
		}

		if (selectedBuildings.length === 1) {
			if (selectedBuildings[0] === id) return;
			const firstPos = getPositionById(selectedBuildings[0]);
			const secondPos = getPositionById(id);
			if (firstPos && secondPos) {
				const path = findCorridorPath(
					corridors,
					rooms,
					[firstPos[0], 0, firstPos[2]],
					[secondPos[0], 0, secondPos[2]],
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
									? [firstPos[0], 0, firstPos[2]]
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

	// New function specifically for showing location information
	const handleLocationClick = (id: string, roomId?: string) => {
		if (roomId) {
			// Clicked on a room
			const room = getRoomById(roomId);
			if (room) {
				setSelectedLocation(room);
				setLocationDialogOpen(true);
				setSelectedRoomId(roomId);
				setSelectedBuildingId(null); // Clear building selection
			}
		} else {
			// Clicked on a building
			const building = getBuildingById(id);
			if (building) {
				setSelectedLocation(building);
				setLocationDialogOpen(true);
				setSelectedBuildingId(id);
				setSelectedRoomId(null); // Clear room selection
			}
		}
	};

	return {
		playerPosition,
		buildings,
		corridors,
		rooms,
		showBuildings,
		setShowBuildings,
		showRooms,
		setShowRooms,
		fromId,
		toId,
		handleFromSelect,
		handleToSelect,
		handleFindPath,
		handleUseCurrentLocation,
		selectedBuildings,
		pathCorridorIds,
		directions,
		hoveredCellCoords,
		setHoveredCellCoords,
		mousePos,
		setMousePos,
		editMode,
		setEditMode,
		handleGridClick,
		handleBuildingClick,
		handleCorridorRemove,
		setSelectedBuildings,
		setPathCorridorIds,
		setDirections,
		selectedBuildingForRoom,
		setSelectedBuildingForRoom,
		handleBuildingPlace,
		handleBuildingRemove,
		handleRoomRemove,
		handleCorridorDraw,
		handleRoomPlace,
		toolMode,
		setToolMode,
		isDrawingCorridor,
		corridorStart,
		setCorridorStart,
		buildingName,
		setBuildingName,
		setBuildingSize,
		setBuildingColor,
		buildingSize,
		buildingColor,
		locationError,
		setLocationError,
		userLocation,
		roomDialogOpen,
		setRoomDialogOpen,
		selectedRoom,
		setSelectedRoom,
		handleRoomDialogClose,
		locationDialogOpen,
		setLocationDialogOpen,
		selectedLocation,
		setSelectedLocation,
		destinationSelectorExpanded,
		setDestinationSelectorExpanded,
		cameraTarget,
		setCameraTarget,
		handleReset,
		handleLocationClick,
		selectedBuildingId,
		setSelectedBuildingId,
		selectedRoomId,
		setSelectedRoomId,
	};
}
