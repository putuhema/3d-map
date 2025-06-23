import { useBuildingRenderer } from "@/hooks/useBuildingRenderer";
import { useLabelStore } from "@/lib/store";
import { useHospitalMapStore } from "@/lib/store";
import { Route } from "@/routes/__root";
import { Plane, Sky } from "@react-three/drei";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { BuildingLabel } from "./building/BuildingLabel";
import { BuildingModel } from "./building/BuildingModel";
import { CorridorRenderer } from "./corridor/corridor-renderer";
import { PathIndicator } from "./path/PathIndicator";
import { RoomLabel } from "./room/RoomLabel";
import { RoomModel } from "./room/RoomModel";

export const BuildingRenderer = () => {
	const {
		buildings,
		corridors,
		rooms,
		pathCorridorIds,
		showBuildings,
		showRooms,
		handleLocationClick,
		handleBuildingClick: handleBuildingClickFromStore,
		selectedId,
		selectedType,
	} = useHospitalMapStore();

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
		handleBuildingHover,
		handleBuildingHoverOut,
		handleRoomHover,
		handleRoomHoverOut,
	} = useBuildingRenderer({
		buildings,
		corridors,
		rooms,
		highlightedCorridorIds: pathCorridorIds,
	});
	const navigate = useNavigate({ from: "/" });
	const { showBuildingLabels, showRoomLabels } = useLabelStore();

	const handleBuildingClick = useCallback(
		(buildingId: string) => {
			handleBuildingClickFromStore(buildingId);
			handleLocationClick(buildingId, undefined);
			navigate({
				search: {
					dialog: buildingId,
					type: "building",
				},
			});
		},
		[handleLocationClick, navigate, handleBuildingClickFromStore],
	);

	const handleRoomClick = useCallback(
		(buildingId: string, roomId: string) => {
			handleLocationClick(buildingId, roomId);
			navigate({
				search: {
					dialog: roomId,
					type: "room",
				},
			});
		},
		[handleLocationClick, navigate],
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
				distance={4500}
				sunPosition={[0, 1, 0]}
				inclination={0.5}
				azimuth={0.25}
				rayleigh={0.5}
				mieCoefficient={0.005}
				mieDirectionalG={0.8}
			/>

			{/* Grass foundation */}
			<Plane
				args={[1000, 1000]}
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, -1, 0]}
			>
				<meshStandardMaterial color="#99BC85" />
			</Plane>

			{pathCorridorIds.length > 0 && <PathIndicator pathData={pathData} />}

			{showBuildings &&
				buildings.map((building) => {
					const buildingRooms = roomsByBuilding.get(building.id) || [];
					const hasRooms = building.hasRooms && buildingRooms.length > 0;
					const isHovered = hoveredBuildingId === building.id;
					const isSelected =
						selectedId === building.id && selectedType === "building";
					const isHighlighted = false;
					const buildingPosition = buildingPositions.positions.get(building.id);
					const buildingScale = buildingPositions.scales.get(building.id);

					if (!buildingPosition || !buildingScale) return null;

					return (
						<group key={building.id}>
							<BuildingModel
								building={building}
								position={buildingPosition}
								scale={buildingScale}
								color={getDestinationColor(building.id)}
								rotation={building.rotation}
								hasRooms={hasRooms}
								isHighlighted={isHighlighted}
								isSelected={isSelected}
								opacity={hasRooms ? 0.4 : 0.3}
								isHovered={isHovered}
								isDestination={isDestination(building.id)}
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
									isFromDestination(building.id)) && (
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

			{showRooms &&
				rooms.map((room) => {
					const isHovered = hoveredRoomId === room.id;
					const isSelected = selectedId === room.id && selectedType === "room";
					const roomPosition = roomPositions.positions.get(room.id);
					const roomScale = roomPositions.scales.get(room.id);

					if (!roomPosition || !roomScale) return null;

					return (
						<group key={room.id}>
							<RoomModel
								room={room}
								position={roomPosition}
								scale={roomScale}
								color={getDestinationColor(room.id)}
								isHovered={isHovered}
								isSelected={isSelected}
								isDestination={isDestination(room.id)}
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
											roomPosition.y + roomScale.y / 2 + 1,
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
			<CorridorRenderer corridors={corridors} />
		</group>
	);
};
