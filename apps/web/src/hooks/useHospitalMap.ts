import { useCallback } from "react";
import { useCamera } from "./useCamera";
import { useDataState } from "./useDataState";
import { useEditMode } from "./useEditMode";
import { useLegacyBuildingClick } from "./useLegacyBuildingClick";
import { useLocationInteraction } from "./useLocationInteraction";
import { useNavigation } from "./useNavigation";
import { usePlayerState } from "./usePlayerState";
import { useUIState } from "./useUIState";

export function useHospitalMap() {
	// Core data state
	const {
		buildings,
		corridors,
		rooms,
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
	} = useDataState();

	// Player state
	const {
		playerPosition,
		updatePlayerPosition,
		locationError,
		setLocationError,
		updateLocationError,
		userLocation,
		updateUserLocation,
	} = usePlayerState();

	// UI state
	const {
		showBuildings,
		setShowBuildings,
		showRooms,
		setShowRooms,
		selectedBuildings,
		setSelectedBuildings,
		pathCorridorIds,
		setPathCorridorIds,
		directions,
		setDirections,
		hoveredCellCoords,
		setHoveredCellCoords,
		mousePos,
		setMousePos,
		roomDialogOpen,
		setRoomDialogOpen,
		selectedRoom,
		setSelectedRoom,
		locationDialogOpen,
		setLocationDialogOpen,
		selectedLocation,
		setSelectedLocation,
		destinationSelectorExpanded,
		setDestinationSelectorExpanded,
		cameraTarget,
		setCameraTarget,
		selectedBuildingId,
		setSelectedBuildingId,
		selectedRoomId,
		setSelectedRoomId,
		selectedBuildingForRoom,
		setSelectedBuildingForRoom,
		resetUI,
		clearPath,
	} = useUIState();

	// Navigation state
	const {
		fromId,
		toId,
		handleFromSelect,
		handleToSelect: navigationHandleToSelect,
		handleUseCurrentLocation,
		findPath,
		resetNavigation,
	} = useNavigation({
		corridors,
		rooms,
		playerPosition: { x: playerPosition.x, z: playerPosition.z },
		getPositionById,
		getRoomById,
		getBuildingById,
	});

	// Edit mode state
	const {
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
		handleBuildingClick: editHandleBuildingClick,
		handleCorridorRemove,
	} = useEditMode({
		buildings,
		onBuildingPlace: addBuilding,
		onBuildingRemove: removeBuilding,
		onRoomPlace: addRoom,
		onRoomRemove: removeRoom,
		onCorridorDraw: addCorridor,
		onCorridorRemove: removeCorridor,
	});

	// Camera state
	const {
		cameraTarget: cameraTargetState,
		setCameraTarget: setCameraTargetState,
	} = useCamera({
		fromId,
		toId,
		playerPosition: { x: playerPosition.x, z: playerPosition.z },
		getRoomById,
		getBuildingById,
	});

	// Location interaction
	const {
		handleToSelect: locationHandleToSelect,
		handleLocationClick,
		handleRoomDialogClose,
	} = useLocationInteraction({
		getRoomById,
		getBuildingById,
		setSelectedLocation,
		setLocationDialogOpen,
		setSelectedBuildingId,
		setSelectedRoomId,
		setDestinationSelectorExpanded,
		clearPath,
	});

	// Legacy building click for backward compatibility
	const { handleBuildingClick: legacyHandleBuildingClick } =
		useLegacyBuildingClick({
			selectedBuildings,
			setSelectedBuildings,
			setPathCorridorIds,
			setDirections,
			getPositionById,
			corridors,
			rooms,
		});

	// Combined building click handler
	const handleBuildingClick = useCallback(
		(id: string, roomId?: string) => {
			// Handle edit mode first
			if (editMode && toolMode === "remove") {
				editHandleBuildingClick(id, roomId);
				return;
			}

			// Handle location click for showing dialogs
			handleLocationClick(id, roomId);

			// Handle legacy pathfinding logic
			legacyHandleBuildingClick(id, roomId);
		},
		[
			editMode,
			toolMode,
			editHandleBuildingClick,
			handleLocationClick,
			legacyHandleBuildingClick,
		],
	);

	// Enhanced handleToSelect that combines navigation and location interaction
	const handleToSelect = useCallback(
		(id: string, type: "building" | "room" | "corridor") => {
			navigationHandleToSelect(id, type);
			locationHandleToSelect(id, type);
		},
		[navigationHandleToSelect, locationHandleToSelect],
	);

	// Pathfinding handler
	const handleFindPath = useCallback(() => {
		const { path, directions: pathDirections } = findPath();
		setPathCorridorIds(path);
		setDirections(pathDirections);
	}, [findPath, setPathCorridorIds, setDirections]);

	// Enhanced room dialog close that triggers pathfinding
	const handleRoomDialogCloseEnhanced = useCallback(() => {
		handleRoomDialogClose();
		// Trigger pathfinding when location dialog closes
		if (fromId && toId && fromId !== toId) {
			handleFindPath();
		}
	}, [handleRoomDialogClose, fromId, toId, handleFindPath]);

	// Reset function to clear navigation and tracking
	const handleReset = useCallback(() => {
		resetUI();
		resetNavigation();
	}, [resetUI, resetNavigation]);

	// Enhanced grid click that includes selectedBuildingForRoom
	const handleGridClickEnhanced = useCallback(
		(x: number, y: number, gridSize = 100) => {
			handleGridClick(x, y, gridSize, selectedBuildingForRoom);
		},
		[handleGridClick, selectedBuildingForRoom],
	);

	// Enhanced corridor remove that clears path if needed
	const handleCorridorRemoveEnhanced = useCallback(
		(id: string) => {
			handleCorridorRemove(id);
			if (pathCorridorIds.includes(id)) {
				setPathCorridorIds([]);
				setDirections([]);
			}
		},
		[handleCorridorRemove, pathCorridorIds, setPathCorridorIds, setDirections],
	);

	return {
		// Player state
		playerPosition,
		locationError,
		setLocationError,
		userLocation,

		// Data state
		buildings,
		corridors,
		rooms,

		// UI state
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
		handleGridClick: handleGridClickEnhanced,
		handleBuildingClick,
		handleCorridorRemove: handleCorridorRemoveEnhanced,
		setSelectedBuildings,
		setPathCorridorIds,
		setDirections,
		selectedBuildingForRoom,
		setSelectedBuildingForRoom,
		handleBuildingPlace: addBuilding,
		handleBuildingRemove: removeBuilding,
		handleRoomRemove: removeRoom,
		handleCorridorDraw: addCorridor,
		handleRoomPlace: addRoom,
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
		roomDialogOpen,
		setRoomDialogOpen,
		selectedRoom,
		setSelectedRoom,
		handleRoomDialogClose: handleRoomDialogCloseEnhanced,
		locationDialogOpen,
		setLocationDialogOpen,
		selectedLocation,
		setSelectedLocation,
		destinationSelectorExpanded,
		setDestinationSelectorExpanded,
		cameraTarget: cameraTargetState,
		setCameraTarget: setCameraTargetState,
		handleReset,
		handleLocationClick,
		selectedBuildingId,
		setSelectedBuildingId,
		selectedRoomId,
		setSelectedRoomId,
	};
}
