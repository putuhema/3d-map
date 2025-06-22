import { buildings } from "@/data/building";
import type { Building } from "@/data/building";
import { corridors } from "@/data/corridor";
import type { Corridor } from "@/data/corridor";
import { rooms } from "@/data/room";
import type { Room } from "@/data/room";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LabelState {
	showBuildingLabels: boolean;
	showRoomLabels: boolean;
	toggleBuildingLabels: () => void;
	toggleRoomLabels: () => void;
	setBuildingLabels: (show: boolean) => void;
	setRoomLabels: (show: boolean) => void;
}

interface ViewState {
	viewMode: "topDown" | "perspective" | "walk";
	cameraMode: "free" | "topDown";
	setViewMode: (mode: "topDown" | "perspective" | "walk") => void;
	setCameraMode: (mode: "free" | "topDown") => void;
}

interface TutorialState {
	hasSeenTutorial: boolean;
	showTutorial: boolean;
	setHasSeenTutorial: (seen: boolean) => void;
	setShowTutorial: (show: boolean) => void;
	dismissTutorial: () => void;
}

interface HospitalMapState {
	// UI State
	showBuildings: boolean;
	showRooms: boolean;
	selectedId: string | null;
	selectedType: "building" | "room" | null;
	pathCorridorIds: string[];
	directions: string[];
	hoveredCellCoords: [number, number] | null;
	mousePos: [number, number] | null;
	editMode: boolean;
	toolMode: "place" | "room" | "corridor" | "remove";
	isDrawingCorridor: boolean;
	corridorStart: [number, number, number] | null;
	buildingName: string;
	buildingSize: [number, number, number];
	buildingColor: string;
	locationError: string | null;
	roomDialogOpen: boolean;
	selectedRoom: Room | null;
	locationDialogOpen: boolean;
	selectedLocation: Building | Room | null;
	cameraTarget: [number, number, number];
	selectedBuildingForRoom: string | null;

	// Data State
	buildings: Building[];
	corridors: Corridor[];
	rooms: Room[];

	// Setters
	setShowBuildings: (show: boolean) => void;
	setShowRooms: (show: boolean) => void;
	setSelectedIdAndType: (
		id: string | null,
		type: "building" | "room" | null,
	) => void;
	setPathCorridorIds: (ids: string[]) => void;
	setDirections: (directions: string[]) => void;
	setHoveredCellCoords: (coords: [number, number] | null) => void;
	setMousePos: (pos: [number, number] | null) => void;
	setEditMode: (edit: boolean) => void;
	setToolMode: (mode: "place" | "room" | "corridor" | "remove") => void;
	setIsDrawingCorridor: (drawing: boolean) => void;
	setCorridorStart: (start: [number, number, number] | null) => void;
	setBuildingName: (name: string) => void;
	setBuildingSize: (size: [number, number, number]) => void;
	setBuildingColor: (color: string) => void;
	setLocationError: (error: string | null) => void;
	setRoomDialogOpen: (open: boolean) => void;
	setSelectedRoom: (room: Room | null) => void;
	setLocationDialogOpen: (open: boolean) => void;
	setSelectedLocation: (location: Building | Room | null) => void;
	setCameraTarget: (target: [number, number, number]) => void;
	setSelectedBuildingForRoom: (id: string | null) => void;

	// Data setters
	setBuildings: (buildings: Building[]) => void;
	setCorridors: (corridors: Corridor[]) => void;
	setRooms: (rooms: Room[]) => void;

	// Helper functions
	getBuildingById: (id: string) => Building | undefined;
	getRoomById: (id: string) => Room | undefined;
	getCorridorById: (id: string) => Corridor | undefined;
	getPositionById: (id: string) => [number, number, number] | null;
	resetUI: () => void;
	clearPath: () => void;
	handleUseCurrentLocation: () => void;
	handleReset: () => void;
	handleBuildingPlace: (building: Building) => void;
	handleBuildingRemove: (id: string) => void;
	handleRoomRemove: (id: string) => void;
	handleCorridorDraw: (corridor: Corridor) => void;
	handleCorridorRemove: (id: string) => void;
	handleRoomPlace: (room: Room) => void;
	handleGridClick: (x: number, y: number, gridSize?: number) => void;
	handleBuildingClick: (id: string, roomId?: string) => void;
	handleLocationClick: (id: string, roomId?: string) => void;
}

export const useLabelStore = create<LabelState>((set) => ({
	showBuildingLabels: false,
	showRoomLabels: false,
	toggleBuildingLabels: () =>
		set((state) => ({ showBuildingLabels: !state.showBuildingLabels })),
	toggleRoomLabels: () =>
		set((state) => ({ showRoomLabels: !state.showRoomLabels })),
	setBuildingLabels: (show: boolean) => set({ showBuildingLabels: show }),
	setRoomLabels: (show: boolean) => set({ showRoomLabels: show }),
}));

export const useViewStore = create<ViewState>((set) => ({
	viewMode: "perspective",
	cameraMode: "free",
	setViewMode: (mode) => set({ viewMode: mode }),
	setCameraMode: (mode) => set({ cameraMode: mode }),
}));

export const useTutorialStore = create<TutorialState>()(
	persist(
		(set) => ({
			hasSeenTutorial: false,
			showTutorial: false,
			setHasSeenTutorial: (seen: boolean) => set({ hasSeenTutorial: seen }),
			setShowTutorial: (show: boolean) => set({ showTutorial: show }),
			dismissTutorial: () =>
				set({ showTutorial: false, hasSeenTutorial: true }),
		}),
		{
			name: "tutorial-storage",
			partialize: (state) => ({ hasSeenTutorial: state.hasSeenTutorial }),
		},
	),
);

export const useHospitalMapStore = create<HospitalMapState>((set, get) => ({
	// Initial state
	showBuildings: true,
	showRooms: true,
	selectedId: null,
	selectedType: null,
	pathCorridorIds: [],
	directions: [],
	hoveredCellCoords: null,
	mousePos: null,
	editMode: false,
	toolMode: "place",
	isDrawingCorridor: false,
	corridorStart: null,
	buildingName: "",
	buildingSize: [2, 1, 2],
	buildingColor: "#4F46E5",
	locationError: null,
	roomDialogOpen: false,
	selectedRoom: null,
	locationDialogOpen: false,
	selectedLocation: null,
	cameraTarget: [0, 0, 0],
	selectedBuildingForRoom: null,
	buildings,
	corridors,
	rooms,

	// Setters
	setShowBuildings: (show) => set({ showBuildings: show }),
	setShowRooms: (show) => set({ showRooms: show }),
	setSelectedIdAndType: (id, type) =>
		set({ selectedId: id, selectedType: type }),
	setPathCorridorIds: (ids) => set({ pathCorridorIds: ids }),
	setDirections: (directions) => set({ directions }),
	setHoveredCellCoords: (coords) => set({ hoveredCellCoords: coords }),
	setMousePos: (pos) => set({ mousePos: pos }),
	setEditMode: (edit) => set({ editMode: edit }),
	setToolMode: (mode) => set({ toolMode: mode }),
	setIsDrawingCorridor: (drawing) => set({ isDrawingCorridor: drawing }),
	setCorridorStart: (start) => set({ corridorStart: start }),
	setBuildingName: (name) => set({ buildingName: name }),
	setBuildingSize: (size) => set({ buildingSize: size }),
	setBuildingColor: (color) => set({ buildingColor: color }),
	setLocationError: (error) => set({ locationError: error }),
	setRoomDialogOpen: (open) => set({ roomDialogOpen: open }),
	setSelectedRoom: (room) => set({ selectedRoom: room }),
	setLocationDialogOpen: (open) => set({ locationDialogOpen: open }),
	setSelectedLocation: (location) => set({ selectedLocation: location }),
	setCameraTarget: (target) => set({ cameraTarget: target }),
	setSelectedBuildingForRoom: (id) => set({ selectedBuildingForRoom: id }),
	setBuildings: (buildings) => set({ buildings }),
	setCorridors: (corridors) => set({ corridors }),
	setRooms: (rooms) => set({ rooms }),

	// Helper functions
	getBuildingById: (id) => get().buildings.find((b) => b.id === id),
	getRoomById: (id) => get().rooms.find((r) => r.id === id),
	getCorridorById: (id) => get().corridors.find((c) => c.id === id),
	getPositionById: (id) => {
		const state = get();
		const building = state.getBuildingById(id);
		if (building) return building.position;
		const room = state.getRoomById(id);
		if (room) return room.position;
		const corridor = state.getCorridorById(id);
		if (corridor) return corridor.start;
		return null;
	},
	resetUI: () =>
		set({
			selectedId: null,
			selectedType: null,
			pathCorridorIds: [],
			directions: [],
			locationDialogOpen: false,
			selectedLocation: null,
		}),
	clearPath: () =>
		set({
			pathCorridorIds: [],
			directions: [],
		}),
	handleUseCurrentLocation: () => {
		set({
			selectedId: null,
			selectedType: null,
			pathCorridorIds: [],
			directions: [],
		});
	},
	handleReset: () => {
		set({
			selectedId: null,
			selectedType: null,
			pathCorridorIds: [],
			directions: [],
			selectedLocation: null,
		});
	},
	handleBuildingPlace: (building) => {
		const newBuilding = { ...building, hasRooms: false };
		set((state) => ({ buildings: [...state.buildings, newBuilding] }));
	},
	handleBuildingRemove: (id) => {
		set((state) => ({ buildings: state.buildings.filter((b) => b.id !== id) }));
	},
	handleRoomRemove: (id) => {
		set((state) => ({ rooms: state.rooms.filter((r) => r.id !== id) }));
	},
	handleCorridorDraw: (corridor) => {
		set((state) => ({ corridors: [...state.corridors, corridor] }));
	},
	handleCorridorRemove: (id) => {
		const state = get();
		if (state.toolMode !== "remove" || !state.editMode) return;
		set((state) => ({ corridors: state.corridors.filter((c) => c.id !== id) }));
		if (state.pathCorridorIds.includes(id)) {
			set({ pathCorridorIds: [], directions: [] });
		}
	},
	handleRoomPlace: (room) => {
		const state = get();
		if (!room.buildingId) {
			const buildingWithRooms = state.buildings.find((b) => b.hasRooms);
			if (buildingWithRooms) {
				room.buildingId = buildingWithRooms.id;
			} else {
				console.warn("No building available for room placement");
				return;
			}
		}
		set((state) => ({ rooms: [...state.rooms, room] }));
	},
	handleGridClick: (x, y, gridSize = 100) => {
		const state = get();
		if (state.toolMode === "place") {
			const centerX = x - (gridSize / 2 - 0.5);
			const centerZ = y - (gridSize / 2 - 0.5);
			const adjustedX = centerX - (state.buildingSize[0] - 1) / 2;
			const adjustedZ = centerZ - (state.buildingSize[2] - 1) / 2;

			state.handleBuildingPlace({
				id: crypto.randomUUID(),
				name: state.buildingName || "New Building",
				position: [adjustedX, 0.5, adjustedZ],
				size: state.buildingSize,
				color: state.buildingColor,
			});
		} else if (state.toolMode === "room") {
			const centerX = x - (gridSize / 2 - 0.5);
			const centerZ = y - (gridSize / 2 - 0.5);
			const adjustedX = centerX - (state.buildingSize[0] - 1) / 2;
			const adjustedZ = centerZ - (state.buildingSize[2] - 1) / 2;

			const targetBuilding = state.selectedBuildingForRoom
				? state.buildings.find((b) => b.id === state.selectedBuildingForRoom)
				: state.buildings.find((b) => b.hasRooms);

			if (!targetBuilding) {
				console.warn("No building available for room placement");
				return;
			}

			state.handleRoomPlace({
				id: crypto.randomUUID(),
				name: state.buildingName || "New Room",
				position: [adjustedX, 0.5, adjustedZ],
				size: state.buildingSize,
				color: state.buildingColor,
				buildingId: targetBuilding.id,
				image: "",
			});
		} else if (state.toolMode === "corridor") {
			if (!state.isDrawingCorridor) {
				set({
					corridorStart: [
						x - (gridSize / 2 - 0.5),
						0,
						y - (gridSize / 2 - 0.5),
					],
					isDrawingCorridor: true,
				});
			} else if (state.corridorStart) {
				state.handleCorridorDraw({
					id: crypto.randomUUID(),
					start: [state.corridorStart[0], 0, state.corridorStart[2]],
					end: [x - (gridSize / 2 - 0.5), 0, y - (gridSize / 2 - 0.5)],
					width: 0.8,
				});
				set({ isDrawingCorridor: false, corridorStart: null });
			}
		}
	},
	handleBuildingClick: (id, roomId) => {
		const state = get();
		if (state.editMode && state.toolMode === "remove") {
			if (roomId) {
				state.handleRoomRemove(roomId);
			} else {
				state.handleBuildingRemove(id);
			}
			return;
		}

		if (roomId) {
			const room = state.getRoomById(roomId);
			if (room) {
				set({
					selectedLocation: room,
					selectedId: roomId,
					selectedType: "room",
				});
			}
		} else {
			const building = state.getBuildingById(id);
			if (building) {
				set({
					selectedLocation: building,
					selectedId: id,
					selectedType: "building",
				});
			}
		}
	},
	handleLocationClick: (id, roomId) => {
		const state = get();
		if (roomId) {
			const room = state.getRoomById(roomId);
			if (room) {
				set({
					selectedLocation: room,
					selectedId: roomId,
					selectedType: "room",
				});
			}
		} else {
			const building = state.getBuildingById(id);
			if (building) {
				set({
					selectedLocation: building,
					selectedId: id,
					selectedType: "building",
				});
			}
		}
	},
}));
