import { useBuildingRenderer } from "@/hooks/useBuildingRenderer";
import { useLabelStore } from "@/lib/store";
import { Route } from "@/routes/__root";
import type { UseBuildingRendererProps } from "@/types/building";
import { Sky } from "@react-three/drei";
import { useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { BuildingLabel } from "./building/BuildingLabel";
import { BuildingModel } from "./building/BuildingModel";
import { CorridorRenderer } from "./corridor/CorridorRenderer";
import { PathIndicator } from "./path/PathIndicator";
import { RoomLabel } from "./room/RoomLabel";
import { RoomModel } from "./room/RoomModel";

export const BuildingRenderer = ({
	buildings,
	corridors,
	rooms,
	highlightedCorridorIds,
	highlightedBuildingIds,
	showBuildings,
	showRooms,
	onBuildingClick,
}: UseBuildingRendererProps & {
	highlightedBuildingIds: string[];
	showBuildings: boolean;
	showRooms: boolean;
	onBuildingClick?: (id: string, roomId?: string) => void;
}) => {
	const { fromId, toId } = useSearch({ from: Route.fullPath });
	const {
		hoveredRoomId,
		hoveredBuildingId,
		roomsByBuilding,
		pathData,
		buildingPositions,
		roomPositions,
		isFromDestination,
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
		fromId,
		toId,
	});

	const { showBuildingLabels, showRoomLabels } = useLabelStore();

	const handleBuildingClick = useCallback(
		(buildingId: string) => {
			onBuildingClick?.(buildingId, undefined);
		},
		[onBuildingClick],
	);

	const handleRoomClick = useCallback(
		(buildingId: string, roomId: string) => {
			onBuildingClick?.(buildingId, roomId);
		},
		[onBuildingClick],
	);

	const handleBuildingHoverCallback = useCallback(
		(buildingId: string) => {
			handleBuildingHover(buildingId);
		},
		[handleBuildingHover],
	);

	const handleRoomHoverCallback = useCallback(
		(roomId: string) => {
			handleRoomHover(roomId);
		},
		[handleRoomHover],
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
					const isSelected = highlightedBuildingIds.includes(building.id);
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
								onClick={
									!hasRooms ? () => handleBuildingClick(building.id) : undefined
								}
								onPointerOver={
									!hasRooms
										? () => handleBuildingHoverCallback(building.id)
										: undefined
								}
								onPointerOut={!hasRooms ? handleBuildingHoverOut : undefined}
							/>
							{building.name &&
								(showBuildingLabels ||
									isDestination(building.id) ||
									isFromDestination(building.id)) &&
								(isDestination(building.id) ||
									isFromDestination(building.id) ||
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
					const isSelected = highlightedBuildingIds.includes(room.id);
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
								onClick={() => handleRoomClick(room.buildingId, room.id)}
								onPointerOver={() => handleRoomHoverCallback(room.id)}
								onPointerOut={handleRoomHoverOut}
								rotation={room.rotation}
							/>
							{room.name &&
								room.name !== "Wall" &&
								(showRoomLabels ||
									isDestination(room.id) ||
									isFromDestination(room.id)) && (
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
				onCorridorClick={() => {}}
			/>
		</group>
	);
};
