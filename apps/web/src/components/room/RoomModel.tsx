import type { Room } from "@/data/room";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { memo, useMemo } from "react";
import type { Vector3 } from "three";

interface RoomModelProps {
	room: Room;
	position: Vector3;
	scale: Vector3;
	onClick?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOver?: (e: ThreeEvent<MouseEvent>) => void;
	onPointerOut?: (e: ThreeEvent<MouseEvent>) => void;
	color?: string;
	opacity?: number;
	isHighlighted?: boolean;
	isSelected?: boolean;
	isHovered?: boolean;
	rotation?: [number, number, number];
}

export const RoomModel = memo(function RoomModel({
	room,
	position,
	scale,
	onClick,
	onPointerOver,
	onPointerOut,
	color,
	opacity = 1,
	isHighlighted = false,
	isSelected = false,
	isHovered = false,
	rotation,
}: RoomModelProps) {
	const shouldUseCustomModel = room.name !== "Wall";

	const gltf = useGLTF("/models/room.glb");

	// Simplified scene cloning - only clone once
	const clonedScene = useMemo(() => {
		if (!gltf.scene || !shouldUseCustomModel) return null;
		return gltf.scene.clone();
	}, [gltf.scene, shouldUseCustomModel]);

	if (!shouldUseCustomModel) {
		return (
			<group>
				<mesh
					position={position}
					scale={scale}
					renderOrder={1}
					rotation={rotation}
				>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial
						color="#E7C293"
						transparent={true}
						opacity={opacity}
						roughness={0.5}
						depthWrite={true}
					/>
				</mesh>
			</group>
		);
	}

	// Don't render if scene is not loaded
	if (!clonedScene) {
		// Fallback to simple box geometry if GLB model fails to load
		return (
			<group>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: mesh elements don't support keyboard events */}
				<mesh
					position={position}
					scale={scale}
					onPointerOver={onPointerOver}
					onClick={onClick}
					onPointerOut={onPointerOut}
					renderOrder={1}
					rotation={rotation}
				>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial
						color={color || "#E7C293"}
						transparent={true}
						opacity={opacity}
						roughness={isHovered ? 0.3 : 0.5}
						depthWrite={true}
					/>
				</mesh>
			</group>
		);
	}

	return (
		<group>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: mesh elements don't support keyboard events */}
			<mesh
				position={[position.x, position.y - 0.5, position.z]}
				scale={scale}
				onClick={onClick}
				onPointerOver={onPointerOver}
				onPointerOut={onPointerOut}
				renderOrder={1}
				rotation={rotation}
			>
				<primitive object={clonedScene} />
			</mesh>

			{/* Highlighted material overlay */}
			{isHighlighted && (
				<primitive
					object={clonedScene.clone()}
					position={[position.x, position.y - 0.5, position.z]}
					scale={scale}
					rotation={rotation}
				>
					<meshStandardMaterial
						color="#f59e42"
						roughness={0.3}
						transparent={true}
						opacity={0.8}
					/>
				</primitive>
			)}
		</group>
	);
});
