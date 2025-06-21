import { buildings } from "@/data/building";
import type { Building } from "@/data/building";
import { corridors } from "@/data/corridor";
import type { Corridor } from "@/data/corridor";
import { rooms } from "@/data/room";
import type { Room } from "@/data/room";
import { useCallback, useEffect, useState } from "react";

export function useDataState() {
	// State for editable data
	const [buildingsState, setBuildingsState] = useState<Building[]>(buildings);
	const [corridorsState, setCorridorsState] = useState<Corridor[]>(corridors);
	const [roomsState, setRoomsState] = useState<Room[]>(rooms);

	// Load saved state from localStorage on mount
	useEffect(() => {
		const storedBuildings = localStorage.getItem("buildings");
		const storedCorridors = localStorage.getItem("corridors");
		const storedRooms = localStorage.getItem("rooms");

		if (storedBuildings) {
			try {
				const parsedBuildings = JSON.parse(storedBuildings);
				setBuildingsState(parsedBuildings);
			} catch (e) {
				console.warn("Failed to parse stored buildings", e);
			}
		}

		if (storedCorridors) {
			try {
				const parsedCorridors = JSON.parse(storedCorridors);
				setCorridorsState(parsedCorridors);
			} catch (e) {
				console.warn("Failed to parse stored corridors", e);
			}
		}

		if (storedRooms) {
			try {
				const parsedRooms = JSON.parse(storedRooms);
				setRoomsState(parsedRooms);
			} catch (e) {
				console.warn("Failed to parse stored rooms", e);
			}
		}
	}, []);

	// Save state to localStorage when data changes
	useEffect(() => {
		localStorage.setItem("buildings", JSON.stringify(buildingsState));
	}, [buildingsState]);

	useEffect(() => {
		localStorage.setItem("corridors", JSON.stringify(corridorsState));
	}, [corridorsState]);

	useEffect(() => {
		localStorage.setItem("rooms", JSON.stringify(roomsState));
	}, [roomsState]);

	// Helper: Find building by id
	const getBuildingById = useCallback(
		(id: string) => buildingsState.find((b) => b.id === id),
		[buildingsState],
	);

	// Helper: Find room by id
	const getRoomById = useCallback(
		(id: string) => roomsState.find((r) => r.id === id),
		[roomsState],
	);

	// Helper: Find corridor by id
	const getCorridorById = useCallback(
		(id: string) => corridorsState.find((c) => c.id === id),
		[corridorsState],
	);

	// Helper: Get position from building, room, or corridor id
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
			const corridor = getCorridorById(id);
			if (corridor) {
				// For corridors, use the start position as the reference point
				return corridor.start;
			}
			return null;
		},
		[getBuildingById, getRoomById, getCorridorById],
	);

	// CRUD operations for buildings
	const addBuilding = useCallback((building: Building) => {
		const newBuilding = {
			...building,
			hasRooms: false,
		};
		setBuildingsState((prev) => [...prev, newBuilding]);
	}, []);

	const removeBuilding = useCallback((id: string) => {
		setBuildingsState((prev) => prev.filter((b) => b.id !== id));
	}, []);

	// CRUD operations for rooms
	const addRoom = useCallback(
		(room: Room) => {
			// If no building is selected for room placement, use the first building with hasRooms=true
			if (!room.buildingId) {
				const buildingWithRooms = buildingsState.find((b) => b.hasRooms);
				if (buildingWithRooms) {
					room.buildingId = buildingWithRooms.id;
				} else {
					console.warn("No building available for room placement");
					return;
				}
			}
			setRoomsState((prev) => [...prev, room]);
		},
		[buildingsState],
	);

	const removeRoom = useCallback((id: string) => {
		setRoomsState((prev) => prev.filter((r) => r.id !== id));
	}, []);

	// CRUD operations for corridors
	const addCorridor = useCallback((corridor: Corridor) => {
		setCorridorsState((prev) => [...prev, corridor]);
	}, []);

	const removeCorridor = useCallback((id: string) => {
		setCorridorsState((prev) => prev.filter((c) => c.id !== id));
	}, []);

	// Reset to default data
	const resetToDefaults = useCallback(() => {
		setBuildingsState(buildings);
		setCorridorsState(corridors);
		setRoomsState(rooms);
	}, []);

	// Clear all data
	const clearAllData = useCallback(() => {
		setBuildingsState([]);
		setCorridorsState([]);
		setRoomsState([]);
	}, []);

	// Export data as JSON
	const exportData = useCallback(() => {
		const data = {
			buildings: buildingsState,
			corridors: corridorsState,
			rooms: roomsState,
			exportedAt: new Date().toISOString(),
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `hospital-map-data-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [buildingsState, corridorsState, roomsState]);

	// Import data from JSON
	const importData = useCallback(
		(data: { buildings: Building[]; corridors: Corridor[]; rooms: Room[] }) => {
			try {
				setBuildingsState(data.buildings || []);
				setCorridorsState(data.corridors || []);
				setRoomsState(data.rooms || []);
				return true;
			} catch (error) {
				console.error("Failed to import data:", error);
				return false;
			}
		},
		[],
	);

	// Check if data has been modified from defaults
	const hasModifications = useCallback(() => {
		const buildingsModified =
			JSON.stringify(buildingsState) !== JSON.stringify(buildings);
		const corridorsModified =
			JSON.stringify(corridorsState) !== JSON.stringify(corridors);
		const roomsModified = JSON.stringify(roomsState) !== JSON.stringify(rooms);
		return buildingsModified || corridorsModified || roomsModified;
	}, [buildingsState, corridorsState, roomsState]);

	// Get data statistics
	const getDataStats = useCallback(() => {
		return {
			buildings: buildingsState.length,
			corridors: corridorsState.length,
			rooms: roomsState.length,
			hasModifications: hasModifications(),
		};
	}, [
		buildingsState.length,
		corridorsState.length,
		roomsState.length,
		hasModifications,
	]);

	return {
		buildings: buildingsState,
		corridors: corridorsState,
		rooms: roomsState,
		getBuildingById,
		getRoomById,
		getCorridorById,
		getPositionById,
		addBuilding,
		removeBuilding,
		addRoom,
		removeRoom,
		addCorridor,
		removeCorridor,
		resetToDefaults,
		clearAllData,
		exportData,
		importData,
		hasModifications,
		getDataStats,
	};
}
