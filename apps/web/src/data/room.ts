export type Room = {
	id: string;
	name: string;
	position: [number, number, number];
	size: [number, number, number];
	color: string;
	buildingId: string;
};

export const rooms = [
	{
		id: "4fd91852-86f2-4584-9cbc-238c99a938d7",
		name: "Kasir",
		position: [2.5, 0.5, 8.5],
		size: [1, 1, 1],
		color: "#d8d2f9",
		buildingId: "8e99cb47-93dd-40ee-aa8e-583e71b35382",
	},
	{
		id: "5e2e2a81-e0a9-4622-9fc5-28f3418fa569",
		name: "Kasir",
		position: [3.5, 0.5, 8.5],
		size: [1, 1, 1],
		color: "#d8d2f9",
		buildingId: "8e99cb47-93dd-40ee-aa8e-583e71b35382",
	},
	{
		id: "dd40b7d6-c9e9-43f1-bb16-2b28addc3b3b",
		name: "Casemix",
		position: [3, 0.5, 7.5],
		size: [2, 1, 1],
		color: "#d8d2f9",
		buildingId: "8e99cb47-93dd-40ee-aa8e-583e71b35382",
	},
	{
		id: "a512e385-5e30-476d-95a5-cc49490ba3b4",
		name: "Server",
		position: [6, 0.5, 7.5],
		size: [2, 1, 1],
		color: "#d8d2f9",
		buildingId: "8e99cb47-93dd-40ee-aa8e-583e71b35382",
	},
	{
		id: "ea3cf5f0-ae04-420f-b3b0-fbb540bf7d86",
		name: "Gudang RM",
		position: [6, 0.5, 9],
		size: [2, 1, 2],
		color: "#d8d2f9",
		buildingId: "8e99cb47-93dd-40ee-aa8e-583e71b35382",
	},
	{
		id: "de9d6cf8-eae5-4252-a377-be56dfbc06db",
		name: "RM",
		position: [6, 0.5, 11],
		size: [2, 1, 2],
		color: "#d8d2f9",
		buildingId: "8e99cb47-93dd-40ee-aa8e-583e71b35382",
	},
];
