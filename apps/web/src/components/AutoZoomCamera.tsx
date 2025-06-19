import { useViewStore } from "@/lib/store";
import { cameraPositions } from "@/utils/constants";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface AutoZoomCameraProps {
	cameraTarget: [number, number, number];
	fromId: string | null;
	toId: string | null;
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

export function AutoZoomCamera({
	cameraTarget,
	fromId,
	toId,
	rooms,
}: AutoZoomCameraProps) {
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const { viewMode, cameraMode, setViewMode, setCameraMode } = useViewStore();
	const animationRef = useRef<number | null>(null);
	const [userHasMovedCamera, setUserHasMovedCamera] = useState(false);
	const [previousViewMode, setPreviousViewMode] = useState(viewMode);
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	// Detect mobile device on mount
	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	// Function to calculate optimal distance for two rooms
	const calculateOptimalDistance = useCallback(() => {
		if (!fromId || !toId || fromId === "current") return null;

		const fromRoom = rooms.find((r) => r.id === fromId);
		const toRoom = rooms.find((r) => r.id === toId);

		if (!fromRoom || !toRoom) return null;

		// Calculate distance between room centers
		const distanceX = Math.abs(toRoom.position[0] - fromRoom.position[0]);
		const distanceZ = Math.abs(toRoom.position[2] - fromRoom.position[2]);
		const maxDistance = Math.max(distanceX, distanceZ);

		// Add padding and room sizes
		const fromSize = Math.max(fromRoom.size[0], fromRoom.size[2]);
		const toSize = Math.max(toRoom.size[0], toRoom.size[2]);
		const totalSize = fromSize + toSize;

		// Calculate optimal distance with padding
		// Use larger padding for mobile devices for better visibility
		const paddingMultiplier = isMobileDevice ? 2.0 : 1.5;
		const optimalDistance = Math.max(
			maxDistance * paddingMultiplier + totalSize,
			isMobileDevice ? 8 : 5, // Higher minimum distance for mobile
		);
		return optimalDistance;
	}, [fromId, toId, rooms, isMobileDevice]);

	// Function to smoothly animate camera
	const animateCamera = useCallback(
		(targetPos: [number, number, number], targetDistance: number | null) => {
			if (!controlsRef.current) return;

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
		if (!controlsRef.current) return;

		// Reset user movement flag when room selection changes
		setUserHasMovedCamera(false);

		const optimalDistance = calculateOptimalDistance();

		if (optimalDistance) {
			// Store the current view mode before switching to top-down
			if (viewMode !== "topDown") {
				setPreviousViewMode(viewMode);
			}

			// Switch to top-down view for room viewing
			setViewMode("topDown");
			setCameraMode("topDown");

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
