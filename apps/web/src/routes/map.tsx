import { AutoZoomCamera } from "@/components/auto-zoom-camera";
import { BuildingRenderer } from "@/components/building-renderer";
import { BuildingTools } from "@/components/building-tools";
import { GridSystem } from "@/components/grid-system";
import { ViewControls } from "@/components/hospital-map/ViewControls";

import { Canvas } from "@react-three/fiber";
import {
	EffectComposer,
	Outline,
	Selection,
} from "@react-three/postprocessing";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/map")({
	component: RouteComponent,
});

const isMobile = () => {
	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		) || window.innerWidth <= 768
	);
};

function RouteComponent() {
	const [isMobileDevice, setIsMobileDevice] = useState(false);

	useEffect(() => {
		setIsMobileDevice(isMobile());
	}, []);

	return (
		<div className="relative h-screen w-full">
			<ViewControls />
			<Canvas>
				<fog attach="fog" args={["#ffffff", 50, isMobileDevice ? 300 : 150]} />
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
				<GridSystem gridSize={100} cellSize={1} />
			</Canvas>
			<BuildingTools />
		</div>
	);
}
