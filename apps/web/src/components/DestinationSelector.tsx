import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Building } from "@/data/building";
import type { Room } from "@/data/room";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";

interface DestinationSelectorProps {
	buildings: Building[];
	rooms: Room[];
	onFromSelect: (id: string, type: "building" | "room") => void;
	onToSelect: (id: string, type: "building" | "room") => void;
	onFindPath: () => void;
	onUseCurrentLocation: () => void;
	fromId: string | null;
	toId: string | null;
	playerPosition: { x: number; y: number; z: number };
}

export function DestinationSelector({
	buildings,
	rooms,
	onFromSelect,
	onToSelect,
	onFindPath,
	onUseCurrentLocation,
	fromId,
	toId,
	playerPosition,
}: DestinationSelectorProps) {
	const [fromSearch, setFromSearch] = useState("");
	const [toSearch, setToSearch] = useState("");
	const [fromOpen, setFromOpen] = useState(false);
	const [toOpen, setToOpen] = useState(false);

	// Get all locations (buildings + rooms)
	const allLocations = useMemo(() => {
		const buildingLocations = buildings.map((building) => ({
			id: building.id,
			name: building.name,
			type: "building" as const,
			displayName: `${building.name} (Building)`,
		}));

		const roomLocations = rooms.map((room) => ({
			id: room.id,
			name: room.name,
			type: "room" as const,
			displayName: `${room.name} (Room)`,
		}));

		return [...buildingLocations, ...roomLocations];
	}, [buildings, rooms]);

	// Filter locations based on search
	const filteredFromLocations = useMemo(() => {
		return allLocations.filter((location) =>
			location.name.toLowerCase().includes(fromSearch.toLowerCase()),
		);
	}, [allLocations, fromSearch]);

	const filteredToLocations = useMemo(() => {
		return allLocations.filter((location) =>
			location.name.toLowerCase().includes(toSearch.toLowerCase()),
		);
	}, [allLocations, toSearch]);

	// Get selected location names
	const getSelectedFromName = () => {
		if (fromId === "current") {
			return `Current Location (${playerPosition.x.toFixed(1)}, ${playerPosition.z.toFixed(1)})`;
		}
		const location = allLocations.find((loc) => loc.id === fromId);
		return location ? location.displayName : "Select starting point";
	};

	const getSelectedToName = () => {
		const location = allLocations.find((loc) => loc.id === toId);
		return location ? location.displayName : "Select destination";
	};

	const handleFromSelect = (id: string, type: "building" | "room") => {
		onFromSelect(id, type);
		setFromOpen(false);
		setFromSearch("");
	};

	const handleToSelect = (id: string, type: "building" | "room") => {
		onToSelect(id, type);
		setToOpen(false);
		setToSearch("");
	};

	const handleUseCurrentLocation = () => {
		onUseCurrentLocation();
		setFromOpen(false);
		setFromSearch("");
	};

	const canFindPath = fromId && toId && fromId !== toId;

	return (
		<div className="absolute top-56 left-6 z-20 max-w-sm rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
			<div className="space-y-4">
				<div className="space-y-2">
					<label
						htmlFor="from-select"
						className="flex items-center gap-2 font-medium text-foreground text-sm"
					>
						<MapPin className="h-4 w-4" />
						From
					</label>
					<DropdownMenu open={fromOpen} onOpenChange={setFromOpen}>
						<DropdownMenuTrigger asChild>
							<Button
								id="from-select"
								variant="outline"
								className="w-full justify-between text-left font-normal"
							>
								<span className="truncate">{getSelectedFromName()}</span>
								<ChevronDown className="h-4 w-4 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-full min-w-[300px]" align="start">
							<div className="p-2">
								<div className="relative">
									<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search locations..."
										value={fromSearch}
										onChange={(e) => setFromSearch(e.target.value)}
										className="pl-8"
									/>
								</div>
							</div>
							<div className="max-h-[200px] overflow-y-auto">
								<DropdownMenuItem
									onClick={handleUseCurrentLocation}
									className="cursor-pointer font-medium text-primary"
								>
									📍 Use Current Location
								</DropdownMenuItem>
								{filteredFromLocations.length === 0 ? (
									<div className="px-2 py-1.5 text-muted-foreground text-sm">
										No locations found
									</div>
								) : (
									filteredFromLocations.map((location) => (
										<DropdownMenuItem
											key={location.id}
											onClick={() =>
												handleFromSelect(location.id, location.type)
											}
											className="cursor-pointer"
										>
											{location.displayName}
										</DropdownMenuItem>
									))
								)}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="space-y-2">
					<label
						htmlFor="to-select"
						className="flex items-center gap-2 font-medium text-foreground text-sm"
					>
						<MapPin className="h-4 w-4" />
						To
					</label>
					<DropdownMenu open={toOpen} onOpenChange={setToOpen}>
						<DropdownMenuTrigger asChild>
							<Button
								id="to-select"
								variant="outline"
								className="w-full justify-between text-left font-normal"
							>
								<span className="truncate">{getSelectedToName()}</span>
								<ChevronDown className="h-4 w-4 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-full min-w-[300px]" align="start">
							<div className="p-2">
								<div className="relative">
									<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search locations..."
										value={toSearch}
										onChange={(e) => setToSearch(e.target.value)}
										className="pl-8"
									/>
								</div>
							</div>
							<div className="max-h-[200px] overflow-y-auto">
								{filteredToLocations.length === 0 ? (
									<div className="px-2 py-1.5 text-muted-foreground text-sm">
										No locations found
									</div>
								) : (
									filteredToLocations.map((location) => (
										<DropdownMenuItem
											key={location.id}
											onClick={() => handleToSelect(location.id, location.type)}
											className="cursor-pointer"
										>
											{location.displayName}
										</DropdownMenuItem>
									))
								)}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<Button onClick={onFindPath} disabled={!canFindPath} className="w-full">
					Find Path
				</Button>
			</div>
		</div>
	);
}
