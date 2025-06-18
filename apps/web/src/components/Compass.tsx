import React from "react";

const directions = [
	{ label: "N", angle: 0 },
	{ label: "NE", angle: Math.PI / 4 },
	{ label: "E", angle: Math.PI / 2 },
	{ label: "SE", angle: (3 * Math.PI) / 4 },
	{ label: "S", angle: Math.PI },
	{ label: "SW", angle: (5 * Math.PI) / 4 },
	{ label: "W", angle: (3 * Math.PI) / 2 },
	{ label: "NW", angle: (7 * Math.PI) / 4 },
];

function getDirectionLabel(angle: number) {
	// Normalize angle to [0, 2PI)
	const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
	let closest = directions[0];
	let minDiff = Math.abs(normalized - closest.angle);
	for (const dir of directions) {
		const diff = Math.abs(normalized - dir.angle);
		if (diff < minDiff) {
			minDiff = diff;
			closest = dir;
		}
	}
	return closest.label;
}

export function Compass({ direction }: { direction: number }) {
	return (
		<div className="relative flex h-20 w-20 select-none items-center justify-center">
			<svg width="80" height="80" viewBox="0 0 80 80" className="absolute">
				<title>Compass Rose</title>
				<circle
					cx="40"
					cy="40"
					r="36"
					stroke="#888"
					strokeWidth="2"
					fill="#fff"
				/>
				{/* Draw main N arrow */}
				<polygon points="40,10 36,30 44,30" fill="#4f46e5" />
				{/* Draw tick marks for each direction */}
				{directions.map((dir, i) => {
					const x1 = 40 + 32 * Math.sin(dir.angle);
					const y1 = 40 - 32 * Math.cos(dir.angle);
					const x2 = 40 + 36 * Math.sin(dir.angle);
					const y2 = 40 - 36 * Math.cos(dir.angle);
					return (
						<line
							key={dir.label}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
							stroke="#aaa"
							strokeWidth={i % 2 === 0 ? 2 : 1}
						/>
					);
				})}
			</svg>
			<div
				className="absolute top-0 left-0 flex h-full w-full items-center justify-center"
				style={{ transform: `rotate(${-direction}rad)` }}
			>
				<svg width="80" height="80" viewBox="0 0 80 80">
					<title>Compass Arrow</title>
					{/* Rotating arrow */}
					<polygon points="40,18 36,40 44,40" fill="#e11d48" />
				</svg>
			</div>
			<div className="-translate-x-1/2 absolute bottom-2 left-1/2 rounded bg-white/80 px-2 py-0.5 font-bold text-gray-700 text-xs shadow">
				{getDirectionLabel(direction)}
			</div>
		</div>
	);
}
