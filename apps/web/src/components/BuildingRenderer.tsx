import { useBuildingRenderer } from "@/hooks/useBuildingRenderer";
import { useLabelStore } from "@/lib/store";
import type { BuildingRendererProps } from "@/types/building";
import { Sky } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { memo, useCallback, useMemo } from "react";
import { BuildingLabel, BuildingModel } from "./building";
import { CorridorRenderer } from "./corridor";
import { PathIndicator } from "./path";
import { RoomLabel } from "./room";

export const BuildingRenderer = memo(function BuildingRenderer({
	buildings,
	corridors,
	rooms,
	onBuildingClick,
	onCorridorClick,
	highlightedCorridorIds = [],
	highlightedBuildingIds = [],
	showBuildings = true,
	showRooms = true,
	fromId,
	toId,
	selectedBuildingId,
	selectedRoomId,
}: BuildingRendererProps) {
	const {
		hoveredRoomId,
		hoveredBuildingId,
		roomsByBuilding,
		pathData,
		buildingPositions,
		roomPositions,
		isFromDestination,
		isToDestination,
		isDestination,
		getDestinationColor,
		isBuildingCloseEnough,
		handleBuildingHover,
		handleBuildingHoverOut,
		handleRoomHover,
		handleRoomHoverOut,
	} = useBuildingRenderer({
		buildings,
		corridors,
		rooms,
		highlightedCorridorIds,
		fromId: fromId ?? null,
		toId: toId ?? null,
	});

	const { showBuildingLabels, showRoomLabels } = useLabelStore();

	// Memoize event handlers to prevent recreation on every render
	const handleBuildingClick = useCallback(
		(buildingId: string) => {
			onBuildingClick?.(buildingId, undefined);
		},
		[onBuildingClick],
	);

	const handleBuildingClickForId = useCallback(
		(buildingId: string) => {
			return () => onBuildingClick?.(buildingId, undefined);
		},
		[onBuildingClick],
	);

	const handleRoomClick = useCallback(
		(buildingId: string, roomId: string) => {
			onBuildingClick?.(buildingId, roomId);
		},
		[onBuildingClick],
	);

	const handleRoomHoverCallback = useCallback(
		(roomId: string) => {
			handleRoomHover(roomId);
		},
		[handleRoomHover],
	);

	const handleRoomHoverOutCallback = useCallback(() => {
		handleRoomHoverOut();
	}, [handleRoomHoverOut]);

	const handleBuildingHoverCallback = useCallback(
		(buildingId: string) => {
			handleBuildingHover(buildingId);
		},
		[handleBuildingHover],
	);

	const handleBuildingHoverForId = useCallback(
		(buildingId: string) => {
			return () => handleBuildingHover(buildingId);
		},
		[handleBuildingHover],
	);

	const handleBuildingHoverOutCallback = useCallback(() => {
		handleBuildingHoverOut();
	}, [handleBuildingHoverOut]);

	const handleRoomHoverForId = useCallback(
		(roomId: string) => {
			return () => handleRoomHover(roomId);
		},
		[handleRoomHover],
	);

	const handleRoomClickForIds = useCallback(
		(buildingId: string, roomId: string) => {
			return () => onBuildingClick?.(buildingId, roomId);
		},
		[onBuildingClick],
	);

	const handleCorridorClick = useCallback(
		(id: string, e: unknown) => {
			onCorridorClick?.(id);
		},
		[onCorridorClick],
	);

	return (
		<group>
			<Sky
				distance={450000}
				sunPosition={[0, 1, 0]}
				inclination={0.5}
				azimuth={0.25}
				rayleigh={0.5}
				mieCoefficient={0.005}
				mieDirectionalG={0.8}
			/>

			{/* Path Indicator */}
			{highlightedCorridorIds.length > 0 && (
				<PathIndicator pathData={pathData} />
			)}

			{/* Buildings */}
			{showBuildings &&
				buildings.map((building) => {
					const buildingRooms = roomsByBuilding.get(building.id) || [];
					const hasRooms = building.hasRooms && buildingRooms.length > 0;
					const isHovered = hoveredBuildingId === building.id;
					const isSelected = selectedBuildingId === building.id;
					const isHighlighted = highlightedBuildingIds.includes(building.id);
					const buildingPosition = buildingPositions.positions.get(building.id);
					const buildingScale = buildingPositions.scales.get(building.id);

					if (!buildingPosition || !buildingScale) return null;

					return (
						<group key={building.id}>
							<BuildingModel
								building={building}
								position={buildingPosition}
								scale={buildingScale}
								color={getDestinationColor(building.id) || undefined}
								rotation={building.rotation}
								hasRooms={hasRooms}
								isHighlighted={isHighlighted}
								isSelected={isSelected}
								opacity={0}
								isHovered={isHovered}
								borderColor={
									isSelected
										? "#3b82f6" // Blue for selected
										: isHighlighted
											? "#f59e0b" // Amber for highlighted
											: isHovered
												? "#10b981" // Green for hovered
												: "#3b82f6"
								}
								onClick={
									!hasRooms ? handleBuildingClickForId(building.id) : undefined
								}
								onPointerOver={
									!hasRooms ? handleBuildingHoverForId(building.id) : undefined
								}
								onPointerOut={
									!hasRooms ? handleBuildingHoverOutCallback : undefined
								}
							/>
							{building.name &&
								showBuildingLabels &&
								(isDestination(building.id) ||
									isBuildingCloseEnough(buildingPosition)) && (
									<BuildingLabel
										buildingName={building.name}
										position={[
											buildingPosition.x,
											buildingPosition.y + buildingScale.y / 2 + 2,
											buildingPosition.z,
										]}
										rotation={building.rotation}
										isDestination={isDestination(building.id)}
										isFromDestination={isFromDestination(building.id)}
									/>
								)}
						</group>
					);
				})}

			{/* Rooms */}
			{showRooms &&
				rooms.map((room) => {
					const isHovered = hoveredRoomId === room.id;
					const isSelected = selectedRoomId === room.id;
					const roomPosition = roomPositions.positions.get(room.id);
					const roomScale = roomPositions.scales.get(room.id);

					if (!roomPosition || !roomScale) return null;

					// Memoize the enabled state for Select component
					const isSelectEnabled = isHovered || isSelected;

					return (
						<group key={room.id}>
							<Select enabled={isSelectEnabled}>
								<mesh
									ref={undefined}
									position={roomPosition}
									scale={roomScale}
									onPointerOver={handleRoomHoverForId(room.id)}
									onPointerDown={handleRoomClickForIds(
										room.buildingId,
										room.id,
									)}
									onPointerOut={handleRoomHoverOutCallback}
									renderOrder={2}
								>
									<boxGeometry args={[1, 1, 1]} />
									<meshStandardMaterial
										color={getDestinationColor(room.id) || room.color}
										transparent={true}
										opacity={1}
										metalness={isHovered ? 0.3 : 0.1}
										roughness={isHovered ? 0.3 : 0.5}
										depthWrite={true}
									/>
								</mesh>
							</Select>
							{room.name && showRoomLabels && (
								<RoomLabel
									roomName={room.name}
									position={[0, room.size[1] / 2 + 0.5, 0]}
									isDestination={isDestination(room.id)}
									isFromDestination={isFromDestination(room.id)}
								/>
							)}
						</group>
					);
				})}

			{/* Corridors */}
			<CorridorRenderer
				corridors={corridors}
				highlightedCorridorIds={highlightedCorridorIds}
				onCorridorClick={handleCorridorClick}
			/>
		</group>
	);
});
