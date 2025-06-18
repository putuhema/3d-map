const refA = { lat: -2.077904, lng: 119.294723, x: 0, z: 0 }; // top-left
const refB = { lat: -2.078807, lng: 119.296418, x: 20, z: 30 }; // bottom-right

const scaleX = (refB.lng - refA.lng) / (refB.x - refA.x);
const scaleZ = (refB.lat - refA.lat) / (refB.z - refA.z);
const offsetX = refA.lng - refA.x * scaleX;
const offsetZ = refA.lat - refA.z * scaleZ;

export function latLngToXZ(lat: number, lng: number) {
	const x = (lng - offsetX) / scaleX;
	const z = (lat - offsetZ) / scaleZ;
	return { x, z };
}

export function xzToLatLng(x: number, z: number) {
	const lng = x * scaleX + offsetX;
	const lat = z * scaleZ + offsetZ;
	return { lat, lng };
}
