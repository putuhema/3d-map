import type { Corridor } from "@/data/corridor";
import { useHospitalMapStore } from "@/lib/store";
import { Route } from "@/routes/__root";
import { Line } from "@react-three/drei";
import { useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";
import { MeshStandardMaterial, Vector3 } from "three";
import { CorridorLabel } from "./CorridorLabel";

interface CorridorRendererProps {
	corridors: Corridor[];
}

export function CorridorRenderer({ corridors }: CorridorRendererProps) {
	const { pathCorridorIds, setCameraTarget } = useHospitalMapStore();
	const { fromId } = useSearch({ from: Route.fullPath });
	const corridorMaterial = useMemo(
		() => new MeshStandardMaterial({ color: "#E4E0E1" }),
		[],
	);

	// Find the corridor that matches the fromId for the "You are here" label
	const currentLocationCorridor = useMemo(() => {
		if (!fromId) return null;
		return corridors.find((corridor) => corridor.id === fromId);
	}, [corridors, fromId]);

	// Focus camera on the "You are here" label when fromId is a corridor
	useEffect(() => {
		if (currentLocationCorridor) {
			const targetPosition: [number, number, number] = [
				currentLocationCorridor.start[0],
				2,
				currentLocationCorridor.start[2],
			];
			setCameraTarget(targetPosition);
		}
	}, [currentLocationCorridor, setCameraTarget]);

	const handleCorridorClick = useCallback((corridorId: string) => {
		console.log("Corridor clicked:", corridorId);
	}, []);

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
					// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
					<mesh
						key={corridor.id}
						position={[midPoint.x, 0.01, midPoint.z]}
						rotation={[-Math.PI / 2, 0, angle]}
						scale={[1, 1, 1]}
						receiveShadow
						material={corridorMaterial}
						onClick={() => handleCorridorClick(corridor.id)}
					>
						<planeGeometry args={[length, corridor.width]} />
					</mesh>
				);
			})}

			{/* Highlighted corridor lines */}
			{corridors.map((corridor) => {
				if (!pathCorridorIds.includes(corridor.id)) return null;

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
						<mesh
							key={`${corridor.id}-joint-${i}`}
							position={[point[0], -0.001, point[2]]}
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

			{/* "You are here" label for current location corridor */}
			{currentLocationCorridor && (
				<CorridorLabel
					label="You are here"
					position={[
						currentLocationCorridor.start[0],
						2,
						currentLocationCorridor.start[2],
					]}
				/>
			)}
		</>
	);
}
