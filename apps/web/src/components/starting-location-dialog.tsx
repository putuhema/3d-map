import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHospitalMapStore } from "@/lib/store";
import { MapPin, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "./ui/input";

interface StartingLocationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	startingLocationId: string | null;
	onStartingLocationChange: (id: string | null) => void;
}

interface Location {
	id: string;
	name: string;
	type: "building" | "room" | "corridor";
	displayName: string;
}

export function StartingLocationDialog({
	open,
	onOpenChange,
	startingLocationId,
	onStartingLocationChange,
}: StartingLocationDialogProps) {
	const [search, setSearch] = useState("");
	const { buildings, rooms } = useHospitalMapStore();

	const allLocations = useMemo(() => {
		const buildingLocations = buildings
			.filter(
				(building) => building.name !== "" && building.name !== "Rekam Medis",
			)
			.map((building) => ({
				id: building.id,
				name: building.name,
				type: "building" as const,
				displayName: `${building.name} (Building)`,
			}));

		const roomLocations = rooms
			.filter((room) => room.name !== "" && room.name !== "Wall")
			.map((room) => ({
				id: room.id,
				name: room.name,
				type: "room" as const,
				displayName: `${room.name} (Room)`,
			}));

		return [
			...buildingLocations,
			...roomLocations,
			{
				id: "8d504f48-9d86-44d0-86be-3c1fd125dece",
				name: "Pos Satpam",
				type: "corridor" as const,
				displayName: "Post Satpam (Corridor)",
			},
			{
				id: "cdcaa148-eaa3-4031-94de-5c1aaa800b03",
				name: "Check Point 1",
				type: "corridor" as const,
				displayName: "Check Point 1 (Corridor)",
			},
			{
				id: "bc3af950-429f-4434-b866-f60f897f82ee",
				name: "Check Point 2",
				type: "corridor" as const,
				displayName: "Check Point 2 (Corridor)",
			},
		].sort((a, b) => a.displayName.localeCompare(b.displayName));
	}, [buildings, rooms]);

	const filteredLocations = useMemo(() => {
		if (!search.trim()) return allLocations;

		return allLocations.filter((location) => {
			return (
				location.name.toLowerCase().includes(search.toLowerCase()) ||
				location.displayName.toLowerCase().includes(search.toLowerCase())
			);
		});
	}, [allLocations, search]);

	const getSelectedName = (id: string | null) => {
		if (!id) return "No starting location set";
		const location = allLocations.find((loc) => loc.id === id);
		return location ? location.name : "Unknown location";
	};

	const handleLocationSelect = (location: Location) => {
		onStartingLocationChange(location.id);
		onOpenChange(false);
		setSearch("");
	};

	const handleClearStartingLocation = () => {
		onStartingLocationChange(null);
		onOpenChange(false);
		setSearch("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<MapPin className="h-5 w-5" />
						Set Starting Location
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Current Starting Location */}
					{startingLocationId && (
						<div className="flex items-center gap-2 rounded-md bg-muted p-3">
							<MapPin className="h-4 w-4 text-primary" />
							<span className="flex-1 font-medium text-sm">
								Current: {getSelectedName(startingLocationId)}
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleClearStartingLocation}
								className="h-6 w-6 p-0"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					)}

					{/* Search Input */}
					<div className="space-y-2">
						<label
							htmlFor="starting-location-search"
							className="font-medium text-sm"
						>
							Search locations
						</label>
						<Input
							id="starting-location-search"
							placeholder="Type to search..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					{/* Location List */}
					<ScrollArea className="h-[300px]">
						<div className="space-y-1">
							{filteredLocations.length > 0 ? (
								filteredLocations.map((location) => (
									<Button
										key={location.id}
										variant="ghost"
										className="h-auto w-full justify-start p-3"
										onClick={() => handleLocationSelect(location)}
									>
										<div className="flex flex-col items-start">
											<span className="font-medium">{location.name}</span>
											<span className="text-muted-foreground text-xs">
												{location.type}
											</span>
										</div>
									</Button>
								))
							) : (
								<div className="p-4 text-center text-muted-foreground text-sm">
									No locations found
								</div>
							)}
						</div>
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
