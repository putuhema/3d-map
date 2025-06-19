import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLabelStore, useViewStore } from "@/lib/store";
import { Check, Menu } from "lucide-react";
import { Button } from "./ui/button";

export default function MapControl() {
	const {
		showBuildingLabels,
		showRoomLabels,
		toggleBuildingLabels,
		toggleRoomLabels,
	} = useLabelStore();

	const { viewMode, cameraMode, setViewMode, setCameraMode } = useViewStore();

	return (
		<div className="absolute bottom-0 left-0 z-20 p-6">
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

					<DropdownMenuItem onClick={() => setViewMode("topDown")}>
						<div className="flex w-full items-center justify-between">
							<span>Top Down View</span>
							{viewMode === "topDown" && <Check className="h-4 w-4" />}
						</div>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setViewMode("perspective")}>
						<div className="flex w-full items-center justify-between">
							<span>Perspective View</span>
							{viewMode === "perspective" && <Check className="h-4 w-4" />}
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
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
