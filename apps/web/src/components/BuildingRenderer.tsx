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
	console.log("Buildings to render:", buildings);

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
			{/* Render Buildings */}
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

			{/* Render Corridors */}
			{corridors.map((corridor) => {
				const start = new Vector3(...corridor.start);
				const end = new Vector3(...corridor.end);
				const length = start.distanceTo(end);
				const midPoint = new Vector3()
					.addVectors(start, end)
					.multiplyScalar(0.5);

				// Calculate the direction vector
				const direction = new Vector3().subVectors(end, start).normalize();

				// Calculate the rotation angle
				const angle = Math.atan2(direction.z, direction.x);

				return (
					<mesh
						key={corridor.id}
						position={[midPoint.x, 0.01, midPoint.z]}
						rotation={[-Math.PI / 2, angle, 0]}
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
