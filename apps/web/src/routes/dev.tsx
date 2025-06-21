import { AutoZoomCamera } from "@/components/AutoZoomCamera";
import { BuildingRenderer } from "@/components/BuildingRenderer";
import { BuildingTools } from "@/components/BuildingTools";
import { Compass } from "@/components/Compass";
import { CoordinateDisplay } from "@/components/CoordinateDisplay";
import { DestinationSelector } from "@/components/DestinationSelector";
import { GridSystem } from "@/components/GridSystem";
import { ViewControls } from "@/components/hospital-map/ViewControls";
import { useHospitalMap } from "@/hooks/useHospitalMap";
import { useViewStore } from "@/lib/store";
import { Route as RootRoute } from "@/routes/__root";
import { Canvas } from "@react-three/fiber";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/dev")({
	component: DevMode,
});

export default function DevMode() {
	const { fromId, toId } = useSearch({ from: RootRoute.fullPath });
	const {
		// Core data
		buildings,
		corridors,
		rooms,

		// Player state
		playerPosition,
		locationError,
		userLocation,

		// UI state
		selectedBuildings,
		pathCorridorIds,
		setPathCorridorIds,
		setDirections,
		hoveredCellCoords,
		setHoveredCellCoords,
		mousePos,
		setMousePos,
		showBuildings,
		setShowBuildings,
		showRooms,
		setShowRooms,

		// Navigation state
		handleFindPath,

		// Edit mode state
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

		// Camera state
		cameraTarget,

		// Location interaction
		handleLocationClick,
		handleRoomDialogClose,

		// Building operations
		handleBuildingPlace,
		handleBuildingRemove,
		handleRoomPlace,
		handleRoomRemove,
		handleCorridorDraw,
	} = useHospitalMap();

	// Combined building click handler
	const handleBuildingClick = useCallback(
		(id: string, roomId?: string) => {
			// Handle edit mode first
			if (editMode && toolMode === "remove") {
				editHandleBuildingClick(id, roomId);
				return;
			}

			// Handle location click for showing dialog
			handleLocationClick(id, roomId);
		},
		[editMode, toolMode, editHandleBuildingClick, handleLocationClick],
	);

	// Pathfinding handler
	const handleFindPathWithLoading = useCallback(() => {
		handleFindPath();
	}, [handleFindPath]);

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
				onFindPath={handleFindPathWithLoading}
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
					rooms={rooms}
					playerPosition={playerPosition}
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
					highlightedCorridorIds={pathCorridorIds}
					highlightedBuildingIds={selectedBuildings}
					showBuildings={showBuildings}
					showRooms={showRooms}
					fromId={fromId}
					toId={toId}
				/>

				<GridSystem
					gridSize={100}
					cellSize={1}
					onCellClick={(x: number, y: number) => {
						if (editMode) {
							handleGridClick(x, y, 100);
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
