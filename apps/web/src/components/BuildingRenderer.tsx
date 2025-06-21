import { useBuildingRenderer } from "@/hooks/useBuildingRenderer";
import { useLabelStore } from "@/lib/store";
import type { BuildingRendererProps } from "@/types/building";
import { Sky } from "@react-three/drei";
import { BuildingLabel, BuildingModel } from "./building";
import { CorridorRenderer } from "./corridor";
import { PathIndicator } from "./path";
import { RoomLabel } from "./room";

export function BuildingRenderer({
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
								opacity={1}
								isHovered={isHovered}
								onClick={
									!hasRooms
										? (e) => onBuildingClick?.(building.id, undefined)
										: undefined
								}
								onPointerOver={
									!hasRooms ? () => handleBuildingHover(building.id) : undefined
								}
								onPointerOut={
									!hasRooms ? () => handleBuildingHoverOut() : undefined
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
							<mesh
								ref={undefined}
								position={roomPosition}
								scale={roomScale}
								onPointerOver={() => handleRoomHover(room.id)}
								onPointerDown={() =>
									onBuildingClick?.(room.buildingId, room.id)
								}
								onPointerOut={() => handleRoomHoverOut()}
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
							{(isHovered || isSelected) && (
								<mesh position={roomPosition} scale={roomScale} renderOrder={3}>
									<boxGeometry args={[1.05, 1.05, 1.05]} />
									<meshStandardMaterial
										color="#ffffff"
										transparent={true}
										opacity={0.3}
										side={2}
										depthWrite={false}
									/>
								</mesh>
							)}
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
				onCorridorClick={(id, e) => onCorridorClick?.(id)}
			/>
		</group>
	);
}
