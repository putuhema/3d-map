export const keyboardMap = [
	{ name: "forward", keys: ["ArrowUp", "KeyW"] },
	{ name: "backward", keys: ["ArrowDown", "KeyS"] },
	{ name: "leftward", keys: ["ArrowLeft", "KeyA"] },
	{ name: "rightward", keys: ["ArrowRight", "KeyD"] },
];

export const cameraPositions = {
	topDown: { position: [0, 15, 6] as [number, number, number] },
	perspective: { position: [-10, 8, 15] as [number, number, number] },
};
