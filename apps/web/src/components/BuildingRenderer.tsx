import type { Building } from "@/data/building";
import type { Corridor } from "@/data/corridor";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MeshStandardMaterial, Vector3 } from "three";
import type { Mesh } from "three";

interface BuildingRendererProps {
	buildings: Building[];
	corridors: Corridor[];
	onBuildingClick?: (id: string) => void;
	highlightedCorridorIds?: string[];
	highlightedBuildingIds?: string[];
	showBuildings?: boolean;
}

export function BuildingRenderer({
	buildings,
	corridors,
	onBuildingClick,
	highlightedCorridorIds = [],
	highlightedBuildingIds = [],
	showBuildings = true,
}: BuildingRendererProps) {
	const buildingRefs = useRef<Map<string, Mesh>>(new Map());

	const handleBuildingClick = (id: string, event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();
		onBuildingClick?.(id);
	};

	const corridorMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#d4d4d8" }),
		[],
	);
	const highlightedMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#22d3ee" }),
		[],
	);
	const highlightedBuildingMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#f59e42" }),
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
						position={new Vector3(...building.position)}
						scale={new Vector3(...building.size)}
						onClick={(e) => handleBuildingClick(building.id, e)}
						castShadow
						receiveShadow
					>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial
							color={building.color}
							metalness={0.1}
							roughness={0.5}
							attach="material"
						/>
						{highlightedBuildingIds.includes(building.id) && (
							<meshStandardMaterial
								color="#f59e42"
								metalness={0.3}
								roughness={0.3}
								transparent={true}
								opacity={0.6}
								attach="material"
							/>
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
					<mesh
						key={corridor.id}
						position={[midPoint.x, 0.01, midPoint.z]}
						rotation={[-Math.PI / 2, 0, angle]}
						scale={[1, 1, 1]}
						receiveShadow
						material={
							highlightedCorridorIds.includes(corridor.id)
								? highlightedMaterial
								: corridorMaterial
						}
					>
						<planeGeometry args={[length, corridor.width]} />
					</mesh>
				);
			})}

			{corridors.map((corridor) => {
				return [0, 1].map((i) => {
					const point = i === 0 ? corridor.start : corridor.end;
					return (
						<mesh
							key={`${corridor.id}-joint-${i}`}
							position={[point[0], -0.01, point[2]]}
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
