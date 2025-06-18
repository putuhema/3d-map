import { xzToLatLng } from "@/lib/geoMapping";

export function CoordinateDisplay({
	x,
	y,
	z,
}: { x: number; y: number; z: number }) {
	const { lat, lng } = xzToLatLng(x, z);
	return (
		<div className="flex min-w-[180px] flex-col gap-1 rounded-lg border bg-white/90 p-2 font-mono text-xs shadow">
			<div>
				<span className="font-semibold">X:</span> {x.toFixed(2)}
				<span className="ml-2 font-semibold">Y:</span> {y.toFixed(2)}
				<span className="ml-2 font-semibold">Z:</span> {z.toFixed(2)}
			</div>
			<div className="text-gray-600">
				<span className="font-semibold">Lat:</span> {lat.toFixed(6)}
				<span className="ml-2 font-semibold">Lng:</span> {lng.toFixed(6)}
			</div>
		</div>
	);
}
