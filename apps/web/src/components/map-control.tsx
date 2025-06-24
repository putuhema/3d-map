import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	useHospitalMapStore,
	useLabelStore,
	useTutorialStore,
	useViewStore,
} from "@/lib/store";
import { Check, HelpCircle, MapPin, Menu } from "lucide-react";
import { useState } from "react";
import { StartingLocationDialog } from "./starting-location-dialog";
import { Button } from "./ui/button";

export default function MapControl() {
	const [showStartingLocationDialog, setShowStartingLocationDialog] =
		useState(false);
	const {
		showBuildingLabels,
		showRoomLabels,
		toggleBuildingLabels,
		toggleRoomLabels,
	} = useLabelStore();

	const { cameraMode, setCameraMode } = useViewStore();
	const { setShowTutorial } = useTutorialStore();
	const { startingLocationId, setStartingLocationId, buildings, rooms } =
		useHospitalMapStore();

	const getStartingLocationName = () => {
		if (!startingLocationId) return "Set Starting Location";

		const building = buildings.find((b) => b.id === startingLocationId);
		if (building) return `${building.name} (Starting)`;

		const room = rooms.find((r) => r.id === startingLocationId);
		if (room) return `${room.name} (Starting)`;

		return "Starting Location";
	};

	return (
		<>
			<div className="absolute bottom-0 left-0 z-20 flex gap-2 px-6 py-20 sm:p-6">
				<Button
					variant="outline"
					size="icon"
					onClick={() => setShowTutorial(true)}
					title="Show tutorial"
				>
					<HelpCircle className="h-4 w-4" />
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<Menu />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem onClick={toggleBuildingLabels}>
							<div className="flex w-full items-center justify-between">
								<span>Label Bangunan</span>
								{showBuildingLabels && <Check className="h-4 w-4" />}
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={toggleRoomLabels}>
							<div className="flex w-full items-center justify-between">
								<span>Label Ruangan</span>
								{showRoomLabels && <Check className="h-4 w-4" />}
							</div>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem onClick={() => setCameraMode("free")}>
							<div className="flex w-full items-center justify-between">
								<span>Free Camera</span>
								{cameraMode === "free" && <Check className="h-4 w-4" />}
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setCameraMode("topDown")}>
							<div className="flex w-full items-center justify-between">
								<span>Locked Top Down</span>
								{cameraMode === "topDown" && <Check className="h-4 w-4" />}
							</div>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem
							onClick={() => setShowStartingLocationDialog(true)}
							className="flex items-center gap-2"
						>
							<MapPin className="h-4 w-4" />
							<span className="truncate">{getStartingLocationName()}</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<StartingLocationDialog
				open={showStartingLocationDialog}
				onOpenChange={setShowStartingLocationDialog}
				startingLocationId={startingLocationId}
				onStartingLocationChange={setStartingLocationId}
			/>
		</>
	);
}
