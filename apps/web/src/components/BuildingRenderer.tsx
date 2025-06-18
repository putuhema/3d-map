import { Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, MeshStandardMaterial, Vector3 } from "three";
import type { Mesh } from "three";
import type { Building, Corridor } from "./BuildingTools";

interface BuildingRendererProps {
	buildings: Building[];
	corridors: Corridor[];
	onBuildingClick?: (id: string) => void;
}

export function BuildingRenderer({
	buildings,
	corridors,
	onBuildingClick,
}: BuildingRendererProps) {
	const buildingRefs = useRef<Map<string, Mesh>>(new Map());

	const handleBuildingClick = (id: string, event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();
		onBuildingClick?.(id);
	};

	// Memoize corridor materials
	const corridorMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#d4d4d8" }),
		[],
	);

	return (
		<group>
			{buildings.map((building) => (
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
					/>
				</mesh>
			))}

			{corridors.map((corridor) => {
				// Always render corridors flat on the x/z plane
				const startXZ = new Vector3(corridor.start[0], 0, corridor.start[2]);
				const endXZ = new Vector3(corridor.end[0], 0, corridor.end[2]);
				const length = startXZ.distanceTo(endXZ);
				const midPoint = new Vector3()
					.addVectors(startXZ, endXZ)
					.multiplyScalar(0.5);
				const direction = new Vector3().subVectors(endXZ, startXZ).normalize();
				const angle = Math.atan2(direction.z, direction.x);

				console.log("Rendering corridor:", {
					start: corridor.start,
					end: corridor.end,
					startXZ,
					endXZ,
					length,
				});

				if (length === 0) return null; // Skip degenerate/vertical corridors

				return (
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
				);
			})}
		</group>
	);
}
