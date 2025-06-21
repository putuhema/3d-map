import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import { Vector3 } from "three";

interface PathIndicatorProps {
	pathData: {
		pathPoints: Vector3[];
		totalLength: number;
	} | null;
}

export function PathIndicator({ pathData }: PathIndicatorProps) {
	const pathIndicatorRef = useRef<Mesh>(null);
	const animationTime = useRef(0);

	// Optimized animated path indicator
	useFrame((state) => {
		if (pathIndicatorRef.current && pathData) {
			animationTime.current += state.clock.getDelta() * 50;

			const { pathPoints, totalLength } = pathData;

			if (pathPoints.length > 1) {
				// Linear motion that resets at the end
				const duration = 2; // seconds for one complete path traversal
				const t = (animationTime.current % duration) / duration;
				const targetDistance = t * totalLength;

				// Find current segment by accumulating distances
				let currentSegment = 0;
				let localProgress = 0;
				let accumulatedLength = 0;

				// Walk through segments until we find the current one
				for (let i = 1; i < pathPoints.length; i++) {
					const segmentLength = pathPoints[i - 1].distanceTo(pathPoints[i]);
					if (targetDistance <= accumulatedLength + segmentLength) {
						currentSegment = i - 1;
						localProgress =
							(targetDistance - accumulatedLength) / segmentLength;
						break;
					}
					accumulatedLength += segmentLength;
				}

				// Ensure we don't go out of bounds
				if (currentSegment >= pathPoints.length - 1) {
					currentSegment = pathPoints.length - 2;
					localProgress = 1;
				}

				// Interpolate position within current segment
				const startPoint = pathPoints[currentSegment];
				const endPoint = pathPoints[currentSegment + 1];
				const position = new Vector3().lerpVectors(
					startPoint,
					endPoint,
					localProgress,
				);

				pathIndicatorRef.current.position.set(position.x, 0.1, position.z);
			}
		}
	});

	if (!pathData) return null;

	return (
		<mesh ref={pathIndicatorRef} position={[0, 0.1, 0]}>
			<sphereGeometry args={[0.2, 16, 16]} />
			<meshStandardMaterial
				color="#ff0000"
				emissive="#ff0000"
				emissiveIntensity={0.5}
				transparent={true}
				opacity={1}
			/>
		</mesh>
	);
}
