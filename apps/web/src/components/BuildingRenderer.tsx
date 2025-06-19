import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { Room } from "@/data/room";
import { Html, Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { MeshStandardMaterial, Vector3 } from "three";
import type { Mesh } from "three";

interface BuildingRendererProps {
	buildings: Building[];
	corridors: Corridor[];
	rooms: Room[];
	onBuildingClick?: (id: string, roomId?: string) => void;
	highlightedCorridorIds?: string[];
	highlightedBuildingIds?: string[];
	showBuildings?: boolean;
}

export function BuildingRenderer({
	buildings,
	corridors,
	rooms,
	onBuildingClick,
	highlightedCorridorIds = [],
	highlightedBuildingIds = [],
	showBuildings = true,
}: BuildingRendererProps) {
	const buildingRefs = useRef<Map<string, Mesh>>(new Map());
	const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

	const handleBuildingClick = (
		id: string,
		roomId: string | undefined,
		event: ThreeEvent<MouseEvent>,
	) => {
		event.stopPropagation();
		onBuildingClick?.(id, roomId);
	};

	const corridorMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#d4d4d8" }),
		[],
	);

	return (
		<group>
			{showBuildings &&
				buildings.map((building) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
					<mesh
						key={building.id}
						ref={(ref) => {
							if (ref) buildingRefs.current.set(building.id, ref);
						}}
						position={
							new Vector3(
								building.position[0],
								building.position[1] + (building.size[1] - 1) / 2,
								building.position[2],
							)
						}
						scale={new Vector3(...building.size)}
						onClick={(e) => handleBuildingClick(building.id, undefined, e)}
						// castShadow
						// receiveShadow
					>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color={building.color}
							metalness={0.1}
							roughness={0.5}
							attach="material"
							transparent={true}
							opacity={0.2}
						/>
						{highlightedBuildingIds.includes(building.id) && (
							<meshStandardMaterial
								color="#f59e42"
								metalness={0.3}
								roughness={0.3}
								transparent={true}
								opacity={0.3}
								attach="material"
							/>
						)}
					</mesh>
				))}

			{rooms.map((room) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<mesh
					key={room.id}
					position={
						new Vector3(
							room.position[0],
							room.position[1] + (room.size[1] - 1) / 2,
							room.position[2],
						)
					}
					scale={new Vector3(...room.size)}
					onClick={(e) => handleBuildingClick(room.id, room.id, e)}
					onPointerOver={(e) => {
						e.stopPropagation();
						setHoveredRoomId(room.id);
					}}
					onPointerOut={(e) => {
						e.stopPropagation();
						setHoveredRoomId(null);
					}}
				>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial
						color={room.color}
						transparent={true}
						opacity={hoveredRoomId === room.id ? 0.8 : 0.6}
						metalness={hoveredRoomId === room.id ? 0.3 : 0.1}
						roughness={hoveredRoomId === room.id ? 0.3 : 0.5}
					/>
					{hoveredRoomId === room.id && (
						<Html
							center
							position={[0, room.size[1] / 2 + 0.5, 0]}
							style={{
								background: "rgba(0, 0, 0, 0.8)",
								color: "white",
								padding: "4px 8px",
								borderRadius: "4px",
								fontSize: "14px",
								whiteSpace: "nowrap",
								pointerEvents: "none",
							}}
						>
							{room.name}
						</Html>
					)}
				</mesh>
			))}

			{corridors.map((corridor) => {
				const startXZ = new Vector3(corridor.start[0], 0, corridor.start[2]);
				const endXZ = new Vector3(corridor.end[0], 0, corridor.end[2]);
				const length = startXZ.distanceTo(endXZ);
				const midPoint = new Vector3()
					.addVectors(startXZ, endXZ)
					.multiplyScalar(0.5);
				const direction = new Vector3().subVectors(endXZ, startXZ).normalize();
				const angle = Math.atan2(direction.z, direction.x);

				if (length === 0) return null;

				return (
					<>
						<mesh
							key={corridor.id}
							position={[midPoint.x, 0.01, midPoint.z]}
							rotation={[-Math.PI / 2, 0, angle]}
							scale={[1, 1, 1]}
							receiveShadow
							material={corridorMaterial}
						>
							<planeGeometry args={[length, corridor.width]} />
						</mesh>
						{highlightedCorridorIds.includes(corridor.id) && (
							<Line
								key={`${corridor.id}-line`}
								points={[
									[corridor.start[0], 0.05, corridor.start[2]],
									[corridor.end[0], 0.05, corridor.end[2]],
								]}
								color="#22d3ee"
								lineWidth={3}
								dashed={false}
							/>
						)}
					</>
				);
			})}

			{corridors.map((corridor) => {
				return [0, 1].map((i) => {
					const point = i === 0 ? corridor.start : corridor.end;
					return (
						<mesh
							key={`${corridor.id}-joint-${i}`}
							position={[point[0], -0.001, point[2]]}
							receiveShadow
						>
							<cylinderGeometry
								args={[corridor.width / 2, corridor.width / 2, 0.05, 16]}
							/>
							<meshStandardMaterial color="#d4d4d8" />
						</mesh>
					);
				});
			})}
		</group>
	);
}
