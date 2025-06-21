import { useBuildingRenderer } from "@/hooks/useBuildingRenderer";
import { useLabelStore } from "@/lib/store";
import type { BuildingRendererProps } from "@/types/building";
import { Sky } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { memo, useCallback, useMemo } from "react";
import { BuildingLabel, BuildingModel } from "./building";
import { CorridorRenderer } from "./corridor";
import { PathIndicator } from "./path";
import { RoomLabel, RoomModel } from "./room";

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

	const handleBuildingClickForId = useCallback(
		(buildingId: string) => {
			return () => onBuildingClick?.(buildingId, undefined);
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
								opacity={hasRooms ? 0.2 : 1}
								isHovered={isHovered}
								// borderColor={
								// 	isSelected
								// 		? "#3b82f6" // Blue for selected
								// 		: isHighlighted
								// 			? "#f59e0b" // Amber for highlighted
								// 			: isHovered
								// 				? "#10b981" // Green for hovered
								// 				: "#3b82f6"
								// }
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

					return (
						<group key={room.id}>
							<RoomModel
								room={room}
								position={roomPosition}
								scale={roomScale}
								color={getDestinationColor(room.id) || undefined}
								isHovered={isHovered}
								isSelected={isSelected}
								onClick={handleRoomClickForIds(room.buildingId, room.id)}
								onPointerOver={handleRoomHoverForId(room.id)}
								onPointerOut={handleRoomHoverOutCallback}
								rotation={room.rotation}
							/>
							{room.name && room.name !== "Wall" && showRoomLabels && (
								<RoomLabel
									roomName={room.name}
									position={[
										roomPosition.x,
										roomPosition.y + roomScale.y / 2,
										roomPosition.z,
									]}
									rotation={room.rotation}
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
