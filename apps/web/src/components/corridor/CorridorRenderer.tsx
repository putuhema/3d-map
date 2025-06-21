import type { Corridor } from "@/data/corridor";
import { Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshStandardMaterial, Vector3 } from "three";

interface CorridorRendererProps {
	corridors: Corridor[];
	highlightedCorridorIds: string[];
	onCorridorClick: (id: string, event: ThreeEvent<MouseEvent>) => void;
}

export function CorridorRenderer({
	corridors,
	highlightedCorridorIds,
	onCorridorClick,
}: CorridorRendererProps) {
	const corridorMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#E4E0E1" }),
		[],
	);

	return (
		<>
			{/* Corridor surfaces */}
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
						material={corridorMaterial}
					>
						<planeGeometry args={[length, corridor.width]} />
					</mesh>
				);
			})}

			{/* Highlighted corridor lines */}
			{corridors.map((corridor) => {
				if (!highlightedCorridorIds.includes(corridor.id)) return null;

				return (
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
				);
			})}

			{/* Corridor click points */}
			{corridors.map((corridor) => {
				return [0, 1].map((i) => {
					const point = i === 0 ? corridor.start : corridor.end;
					return (
						// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
						<mesh
							key={`${corridor.id}-joint-${i}`}
							position={[point[0], -0.001, point[2]]}
							onClick={(e) => onCorridorClick(corridor.id, e)}
							receiveShadow
						>
							<cylinderGeometry
								args={[corridor.width / 2, corridor.width / 2, 0.05, 16]}
							/>
							<meshStandardMaterial color="#E4E0E1" />
						</mesh>
					);
				});
			})}
		</>
	);
}
