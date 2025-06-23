import { AutoZoomCamera } from "@/components/AutoZoomCamera";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { BuildingRenderer } from "@/components/building-renderer";
import { DestinationSelector } from "@/components/destination-selector";
import { LocationDialog } from "@/components/location-dialog";
import MapControl from "@/components/map-control";

import { Canvas } from "@react-three/fiber";
import {
	EffectComposer,
	Outline,
	Selection,
} from "@react-three/postprocessing";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
	component: HospitalMap,
});

const isMobile = () => {
	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		) || window.innerWidth <= 768
	);
};

export default function HospitalMap() {
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	// Detect mobile device on mount
	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	// Mobile-optimized Canvas configuration
	const canvasConfig = useMemo(
		() => ({
			shadows: !isMobileDevice, // Disable shadows on mobile for better performance
			dpr: isMobileDevice
				? ([1, 1.5] as [number, number])
				: ([1, 2] as [number, number]), // Lower DPR on mobile
			gl: {
				antialias: !isMobileDevice, // Disable antialiasing on mobile for performance
				powerPreference: "high-performance" as const,
				stencil: false,
				depth: true,
			},
			camera: {
				fov: isMobileDevice ? 50 : 45, // Slightly wider FOV on mobile
				near: 0.1,
				far: 1000,
				position: (() => {
					const defaultDistance = isMobileDevice ? 50 : 60;
					const angle = isMobileDevice ? Math.PI / 4 : Math.PI / 2;
					const cameraOffsetX = defaultDistance * Math.cos(angle);
					const cameraOffsetY = defaultDistance * Math.sin(angle);
					const cameraOffsetZ = defaultDistance * Math.cos(angle);
					return [-cameraOffsetX, cameraOffsetY, -cameraOffsetZ] as [
						number,
						number,
						number,
					];
				})(),
			},
		}),
		[isMobileDevice],
	);

	return (
		<div className="relative h-screen w-full">
			<TutorialOverlay />
			<DestinationSelector />
			<LocationDialog />
			<Canvas {...canvasConfig}>
				<fog attach="fog" args={["#ffffff", 50, isMobileDevice ? 250 : 150]} />
				<AutoZoomCamera />

				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1}
					castShadow={!isMobileDevice}
					shadow-mapSize-width={isMobileDevice ? 1024 : 2048}
					shadow-mapSize-height={isMobileDevice ? 1024 : 2048}
				/>
				<directionalLight position={[-5, 8, -10]} intensity={0.3} />

				<Selection>
					<EffectComposer multisampling={8} autoClear={false}>
						<Outline blur visibleEdgeColor={0xffffff} edgeStrength={100} />
					</EffectComposer>
					<BuildingRenderer />
				</Selection>
			</Canvas>
			<MapControl />
		</div>
	);
}
