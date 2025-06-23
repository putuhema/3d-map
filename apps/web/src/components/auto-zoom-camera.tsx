import { useHospitalMap } from "@/hooks/useHospitalMap";
import { useViewStore } from "@/lib/store";
import { useHospitalMapStore } from "@/lib/store";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// Mobile detection utility
const isMobile = () => {
	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		) || window.innerWidth <= 768
	);
};

export function AutoZoomCamera() {
	const { cameraTarget } = useHospitalMapStore();
	const { calculateCameraTargetForRooms } = useHospitalMap();
	const { fromId, toId } = useSearch({ strict: false });
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const { cameraMode } = useViewStore();
	const animationRef = useRef<number | null>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	// Detect mobile device on mount
	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	// Effect to recalculate camera target when room selection changes
	useEffect(() => {
		calculateCameraTargetForRooms();
	}, [fromId, toId, calculateCameraTargetForRooms]);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

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
			// Prevent panning below 0 on Y-axis
			const target = controlsRef.current.target;
			if (target.y < 0) {
				target.y = 0;
			}
			controlsRef.current.update();
		}
	});

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
				position={(() => {
					const defaultDistance = isMobileDevice ? 25 : 80;
					const angle = Math.PI / 4; // 45 degrees
					const cameraOffsetX = defaultDistance * Math.cos(angle);
					const cameraOffsetY = defaultDistance * Math.sin(angle);
					const cameraOffsetZ = defaultDistance * Math.cos(angle);
					return [-cameraOffsetX, cameraOffsetY, -cameraOffsetZ];
				})()}
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
