import { useViewStore } from "@/lib/store";
import { Camera, CameraOff, Eye, EyeOff, MapPin } from "lucide-react";

export function CameraModeIndicator() {
	const { viewMode, cameraMode } = useViewStore();

	const getModeInfo = () => {
		switch (cameraMode) {
			case "topDown":
				return {
					icon: <CameraOff className="h-4 w-4" />,
					label: "Top Down View",
					description: "Locked top down view",
					color: "bg-blue-500",
				};
			case "free":
				return {
					icon: <Camera className="h-4 w-4" />,
					label: "Free Camera",
					description: "Free camera mode",
					color: "bg-green-500",
				};
			default:
				return {
					icon: <EyeOff className="h-4 w-4" />,
					label: "Unknown Mode",
					description: "Unknown camera mode",
					color: "bg-gray-500",
				};
		}
	};

	const modeInfo = getModeInfo();

	return (
		<div className="fixed top-4 right-4 z-50">
			<div className="flex items-center gap-2">
				<div className={`rounded-md p-1.5 ${modeInfo.color}`}>
					{modeInfo.icon}
				</div>
			</div>
		</div>
	);
}
