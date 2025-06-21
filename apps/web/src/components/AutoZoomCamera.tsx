import { useViewStore } from "@/lib/store";
import { Route } from "@/routes/__root";
import { cameraPositions } from "@/utils/constants";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface AutoZoomCameraProps {
	cameraTarget: [number, number, number];
	rooms: Array<{
		id: string;
		position: [number, number, number];
		size: [number, number, number];
	}>;
}

// Mobile detection utility
const isMobile = () => {
	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		) || window.innerWidth <= 768
	);
};

export function AutoZoomCamera({ cameraTarget, rooms }: AutoZoomCameraProps) {
	const { fromId, toId } = useSearch({ from: Route.fullPath });
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const { viewMode, cameraMode, setViewMode, setCameraMode } = useViewStore();
	const animationRef = useRef<number | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const [userHasMovedCamera, setUserHasMovedCamera] = useState(false);
	const [previousViewMode, setPreviousViewMode] = useState(viewMode);
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	// Detect mobile device on mount
	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	// Function to calculate optimal distance for two rooms
	const calculateOptimalDistance = useCallback(() => {
		if (!fromId || !toId) return null;

		let fromPos: [number, number, number] | null = null;
		let toPos: [number, number, number] | null = null;

		// Handle current location case

		const fromRoom = rooms.find((r) => r.id === fromId);
		if (fromRoom) {
			fromPos = fromRoom.position;
		}

		// Handle destination (can be room or building)
		const toRoom = rooms.find((r) => r.id === toId);
		if (toRoom) {
			toPos = toRoom.position;
		}

		// Only proceed if we have both positions
		if (!fromPos || !toPos) return null;

		// Validate positions are finite numbers
		if (
			!fromPos.every((coord) => Number.isFinite(coord)) ||
			!toPos.every((coord) => Number.isFinite(coord))
		) {
			return null;
		}

		// Calculate distance between positions
		const distanceX = Math.abs(toPos[0] - fromPos[0]);
		const distanceZ = Math.abs(toPos[2] - fromPos[2]);
		const maxDistance = Math.max(distanceX, distanceZ);

		// Add padding and room sizes
		const fromSize = Math.max(fromPos[0], fromPos[2]); // Use position as size approximation
		const toSize = Math.max(toPos[0], toPos[2]); // Use position as size approximation
		const totalSize = fromSize + toSize;

		// Calculate optimal distance with padding
		// Use larger padding for mobile devices for better visibility
		const paddingMultiplier = isMobileDevice ? 2.0 : 1.5;
		const optimalDistance = Math.max(
			maxDistance * paddingMultiplier + totalSize,
			isMobileDevice ? 8 : 5, // Higher minimum distance for mobile
		);

		// Ensure the distance is finite and reasonable
		if (
			!Number.isFinite(optimalDistance) ||
			optimalDistance <= 0 ||
			optimalDistance > 1000
		) {
			return null;
		}

		return optimalDistance;
	}, [fromId, toId, rooms, isMobileDevice]);

	// Function to smoothly animate camera
	const animateCamera = useCallback(
		(targetPos: [number, number, number], targetDistance: number | null) => {
			if (!controlsRef.current) return;

			// Validate target position
			if (!targetPos.every((coord) => Number.isFinite(coord))) {
				console.warn(
					"Invalid target position for camera animation:",
					targetPos,
				);
				return;
			}

			// Validate target distance if provided
			if (
				targetDistance !== null &&
				(!Number.isFinite(targetDistance) || targetDistance <= 0)
			) {
				console.warn(
					"Invalid target distance for camera animation:",
					targetDistance,
				);
				return;
			}

			// Cancel any existing animation
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}

			const startTime = performance.now();
			const duration = 1000; // 1 second animation
			const startTarget = controlsRef.current.target.clone();
			const startDistance = controlsRef.current.getDistance();

			const animate = (currentTime: number) => {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Easing function (ease-out)
				const easeProgress = 1 - (1 - progress) ** 3;

				// Interpolate target position
				const newTargetX =
					startTarget.x + (targetPos[0] - startTarget.x) * easeProgress;
				const newTargetY =
					startTarget.y + (targetPos[1] - startTarget.y) * easeProgress;
				const newTargetZ =
					startTarget.z + (targetPos[2] - startTarget.z) * easeProgress;

				if (controlsRef.current) {
					controlsRef.current.target.set(newTargetX, newTargetY, newTargetZ);

					// Interpolate distance if target distance is provided
					if (targetDistance !== null) {
						const newDistance =
							startDistance + (targetDistance - startDistance) * easeProgress;
						const currentDistance = controlsRef.current.getDistance();
						const scale = newDistance / currentDistance;
						controlsRef.current.dollyIn(scale);
					}

					controlsRef.current.update();
				}

				if (progress < 1) {
					animationRef.current = requestAnimationFrame(animate);
				}
			};

			animationRef.current = requestAnimationFrame(animate);
		},
		[],
	);

	// Effect to handle auto-zoom when room selection changes
	useEffect(() => {
		// Clear any existing debounce
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		// Debounce the camera animation to prevent excessive updates
		debounceRef.current = setTimeout(() => {
			if (!controlsRef.current) return;

			// Only auto-zoom if both fromId and toId are set
			if (!fromId || !toId) {
				// Reset to default target if no rooms are selected
				// Use higher default distance for mobile
				const defaultDistance = isMobileDevice ? 12 : 6;
				animateCamera([0, 0, defaultDistance], null);
				return;
			}

			// Safety check: ensure rooms array is valid
			if (!Array.isArray(rooms) || rooms.length === 0) {
				return;
			}

			// Reset user movement flag when room selection changes
			setUserHasMovedCamera(false);

			const optimalDistance = calculateOptimalDistance();

			if (optimalDistance) {
				// Store the current view mode before switching to top-down
				if (viewMode !== "topDown") {
					setPreviousViewMode(viewMode);
					setViewMode("topDown");
				}

				if (cameraMode !== "topDown") {
					setCameraMode("topDown");
				}

				// Animate to the new target and distance
				animateCamera(cameraTarget, optimalDistance);
			} else {
				// Restore the previous view mode when no rooms are selected
				if (previousViewMode && previousViewMode !== viewMode) {
					setViewMode(previousViewMode);
					setCameraMode("free");
				}

				// Reset to default target if no rooms are selected
				// Use higher default distance for mobile
				const defaultDistance = isMobileDevice ? 12 : 6;
				animateCamera([0, 0, defaultDistance], null);
			}
		}, 100); // 100ms debounce delay

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [
		cameraTarget,
		fromId,
		toId,
		calculateOptimalDistance,
		animateCamera,
		viewMode,
		setViewMode,
		setCameraMode,
		previousViewMode,
		isMobileDevice,
		rooms,
	]);

	// Cleanup animation on unmount
	useEffect(() => {
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	// Update controls on each frame to ensure smooth animation
	useFrame(() => {
		if (controlsRef.current) {
			controlsRef.current.update();
		}
	});

	// Handle user camera movement
	const handleCameraChange = useCallback(() => {
		setUserHasMovedCamera(true);
	}, []);

	// Mobile-specific zoom configuration
	const mobileZoomConfig = {
		minDistance: 2, // Allow closer zoom on mobile
		maxDistance: 100, // Much higher max distance for better overview
		zoomSpeed: 1.2, // Slightly faster zoom for mobile
	};

	// Desktop zoom configuration
	const desktopZoomConfig = {
		minDistance: 3,
		maxDistance: 50,
		zoomSpeed: 1.0,
	};

	const zoomConfig = isMobileDevice ? mobileZoomConfig : desktopZoomConfig;

	return (
		<>
			<PerspectiveCamera
				makeDefault
				position={
					cameraPositions[viewMode === "topDown" ? "topDown" : "perspective"]
						.position
				}
			/>
			<OrbitControls
				ref={controlsRef}
				target={cameraTarget}
				enableRotate={cameraMode === "free"}
				enablePan={true}
				enableZoom={true}
				minDistance={zoomConfig.minDistance}
				maxDistance={zoomConfig.maxDistance}
				zoomSpeed={zoomConfig.zoomSpeed}
				maxPolarAngle={cameraMode === "topDown" ? 0 : Math.PI / 2 - 0.1}
				enableDamping={true}
				dampingFactor={0.05}
				onChange={handleCameraChange}
				// Configure touch sensitivity for better mobile experience
				panSpeed={isMobileDevice ? 1.5 : 1.0}
				// Use ROTATE for both mobile and desktop to allow both rotation and panning
				touches={{
					ONE: TOUCH.ROTATE,
					TWO: TOUCH.DOLLY_PAN,
				}}
			/>
		</>
	);
}
