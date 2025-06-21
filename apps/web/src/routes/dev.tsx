import { AutoZoomCamera } from "@/components/AutoZoomCamera";
import { BuildingRenderer } from "@/components/BuildingRenderer";
import { BuildingTools } from "@/components/BuildingTools";
import { Compass } from "@/components/Compass";
import { CoordinateDisplay } from "@/components/CoordinateDisplay";
import { DestinationSelector } from "@/components/DestinationSelector";
import { GridSystem } from "@/components/GridSystem";
import { ViewControls } from "@/components/hospital-map/ViewControls";
import { useCamera } from "@/hooks/useCamera";
import { useDataState } from "@/hooks/useDataState";
import { useEditMode } from "@/hooks/useEditMode";
import { useLegacyBuildingClick } from "@/hooks/useLegacyBuildingClick";
import { useLocationInteraction } from "@/hooks/useLocationInteraction";
import { useNavigation } from "@/hooks/useNavigation";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useUIState } from "@/hooks/useUIState";
import { useViewStore } from "@/lib/store";
import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/dev")({
	component: DevMode,
});

export default function DevMode() {
	// Core data state
	const {
		buildings,
		corridors,
		rooms,
		getBuildingById,
		getRoomById,
		getPositionById,
		addBuilding,
		removeBuilding,
		addRoom,
		removeRoom,
		addCorridor,
		removeCorridor,
	} = useDataState();

	// Player state
	const { playerPosition, locationError, userLocation } = usePlayerState();

	// UI state
	const {
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
		showBuildings,
		setShowBuildings,
		showRooms,
		setShowRooms,
		roomDialogOpen,
		setRoomDialogOpen,
		selectedRoom,
		destinationSelectorExpanded,
		setDestinationSelectorExpanded,
		selectedBuildingId,
		selectedRoomId,
	} = useUIState();

	// Navigation state
	const {
		fromId,
		toId,
		handleFromSelect,
		handleToSelect: navigationHandleToSelect,
		handleUseCurrentLocation,
		findPath,
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
		buildingName,
		setBuildingName,
		buildingSize,
		setBuildingSize,
		buildingColor,
		setBuildingColor,
		handleGridClick,
		handleBuildingClick: editHandleBuildingClick,
		handleCorridorRemove: editHandleCorridorRemove,
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
	const { cameraTarget } = useCamera({
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
		setSelectedLocation: () => {}, // Not needed for dev mode
		setLocationDialogOpen: setRoomDialogOpen,
		setSelectedBuildingId: () => {}, // Not needed for dev mode
		setSelectedRoomId: () => {}, // Not needed for dev mode
		setDestinationSelectorExpanded,
		clearPath: () => {
			setSelectedBuildings([]);
			setPathCorridorIds([]);
			setDirections([]);
		},
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

			// Handle legacy pathfinding logic
			legacyHandleBuildingClick(id, roomId);
		},
		[editMode, toolMode, editHandleBuildingClick, legacyHandleBuildingClick],
	);

	// Combined handleToSelect
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

	// Enhanced corridor remove that clears path if needed
	const handleCorridorRemove = useCallback(
		(id: string) => {
			editHandleCorridorRemove(id);
			if (pathCorridorIds.includes(id)) {
				setPathCorridorIds([]);
				setDirections([]);
			}
		},
		[
			editHandleCorridorRemove,
			pathCorridorIds,
			setPathCorridorIds,
			setDirections,
		],
	);

	// Handle cell hover with proper type conversion
	const handleCellHover = useCallback(
		(coords: { x: number; y: number; z: number } | null) => {
			if (coords) {
				setHoveredCellCoords([coords.x, coords.z]);
			} else {
				setHoveredCellCoords(null);
			}
		},
		[setHoveredCellCoords],
	);

	const { viewMode, setViewMode } = useViewStore();

	return (
		<div
			className="relative h-screen w-full"
			onMouseMove={(e) => {
				if (hoveredCellCoords) {
					setMousePos([e.clientX, e.clientY]);
				}
			}}
		>
			<DestinationSelector
				buildings={buildings}
				rooms={rooms}
				onFromSelect={handleFromSelect}
				onToSelect={handleToSelect}
				onFindPath={handleFindPath}
				onUseCurrentLocation={handleUseCurrentLocation}
				fromId={fromId}
				toId={toId}
				playerPosition={playerPosition}
				isExpanded={destinationSelectorExpanded}
				onExpandedChange={setDestinationSelectorExpanded}
			/>

			<ViewControls
				viewMode={viewMode}
				setViewMode={setViewMode}
				showBuildings={showBuildings}
				showRooms={showRooms}
				setShowRooms={setShowRooms}
				setShowBuildings={setShowBuildings}
				editMode={editMode}
				setEditMode={setEditMode}
				locationError={locationError}
				userLocation={userLocation}
			/>

			<Canvas
				shadows
				dpr={[1, 2]}
				gl={{
					antialias: true,
					powerPreference: "high-performance",
					stencil: false,
					depth: true,
				}}
				camera={{
					fov: 45,
					near: 0.1,
					far: 1000,
				}}
			>
				<AutoZoomCamera
					cameraTarget={cameraTarget}
					fromId={fromId}
					toId={toId}
					rooms={rooms}
				/>

				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
				/>
				<directionalLight position={[-5, 8, -10]} intensity={0.3} />

				<BuildingRenderer
					buildings={buildings}
					corridors={corridors}
					rooms={rooms}
					onBuildingClick={handleBuildingClick}
					onCorridorClick={handleCorridorRemove}
					highlightedCorridorIds={pathCorridorIds}
					highlightedBuildingIds={selectedBuildings}
					showBuildings={showBuildings}
					showRooms={showRooms}
				/>

				<GridSystem
					gridSize={100}
					cellSize={1}
					onCellClick={(x: number, y: number) => {
						if (editMode) {
							handleGridClick(
								x,
								y,
								100,
								"1c775b86-68c3-478d-a8c5-3e869dd35919",
							);
						}
					}}
					onCellHover={handleCellHover}
				/>
			</Canvas>

			<BuildingTools
				selectedMode={toolMode}
				onModeChange={setToolMode}
				buildingName={buildingName}
				onBuildingNameChange={setBuildingName}
				buildingSize={buildingSize}
				onBuildingSizeChange={setBuildingSize}
				buildingColor={buildingColor}
				onBuildingColorChange={setBuildingColor}
				buildings={buildings}
				corridors={corridors}
				onCorridorRemove={handleCorridorRemove}
			/>

			<div className="absolute top-6 right-6 z-20">
				<Compass direction={0} />
			</div>
			<div className="absolute right-6 bottom-6 z-20">
				<CoordinateDisplay
					x={playerPosition.x}
					y={playerPosition.y}
					z={playerPosition.z}
				/>
			</div>

			{/* <DirectionsDisplay
				directions={directions}
				onClear={() => {
					setSelectedBuildings([]);
					setPathCorridorIds([]);
					setDirections([]);
					setFromId(null);
					setToId(null);
				}}
			/> */}

			{hoveredCellCoords && mousePos && (
				<div
					className="fixed z-50 rounded bg-black/80 px-2 py-1 text-white text-xs"
					style={{
						left: mousePos[0] + 10,
						top: mousePos[1] - 10,
					}}
				>
					({hoveredCellCoords[0]}, {hoveredCellCoords[1]})
				</div>
			)}
		</div>
	);
}
