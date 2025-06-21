# Building and Room Data Structure

## Overview

This document describes the relationship between buildings and rooms in the hospital map system.

## Data Structure

### Building Type
```typescript
type Building = {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  hasRooms?: boolean; // New: indicates if building can contain rooms
  rotation?: [number, number, number]; // Optional rotation for the building
  modelPath?: string; // New: path to custom GLB model, defaults to "/models/building.glb"
};
```

### Room Type
```typescript
type Room = {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  buildingId: string; // New: references the parent building
  image: string; // Image for room dialog
};
```

## Custom Building Models

The system now supports different 3D models for buildings. You can specify a custom model for each building using the `modelPath` property.

### Available Models

- **Default Model**: `/models/building.glb` - Standard building model
- **Rotated Model**: `/models/building-90.glb` - 90-degree rotated version of the building

### Usage Examples

```typescript
// Building with default model
{
  id: "building-1",
  name: "Standard Building",
  position: [0, 0.5, 0],
  size: [5, 2, 3],
  color: "#4f46e5",
  hasRooms: false,
  // Uses default model (/models/building.glb)
}

// Building with custom model
{
  id: "building-2", 
  name: "Custom Building",
  position: [10, 0.5, 0],
  size: [5, 2, 3],
  color: "#4f46e5",
  hasRooms: false,
  modelPath: "/models/building-90.glb", // Uses rotated model
}
```

### Adding New Models

1. Place your GLB model file in `apps/web/public/models/`
2. Update the `BUILDING_MODELS` constant in `apps/web/src/utils/buildingModels.ts`
3. Add the model path to your building data

```typescript
// In buildingModels.ts
export const BUILDING_MODELS = {
  DEFAULT: "/models/building.glb",
  ROTATED_90: "/models/building-90.glb",
  CUSTOM: "/models/your-custom-model.glb", // Add your new model
} as const;
```

## Relationship Benefits

1. **Parent-Child Relationship**: Rooms are now logically grouped within their parent buildings
2. **Better User Experience**: Users can navigate to specific rooms within buildings
3. **Improved Interaction**: Different click behaviors for buildings vs rooms
4. **Data Organization**: More realistic representation of real-world relationships
5. **Visual Variety**: Different building models for architectural diversity

## Usage Examples

### Getting rooms for a building
```typescript
import { getRoomsForBuilding } from "@/lib/utils";

const buildingRooms = getRoomsForBuilding(buildingId, rooms);
```

### Getting the building for a room
```typescript
import { getBuildingForRoom } from "@/lib/utils";

const parentBuilding = getBuildingForRoom(roomId, rooms, buildings);
```

### Finding buildings with rooms
```typescript
import { getBuildingsWithRooms } from "@/lib/utils";

const buildingsWithRooms = getBuildingsWithRooms(buildings, rooms);
```

### Finding the best building for room placement
```typescript
import { findBestBuildingForRoom } from "@/lib/utils";

const bestBuilding = findBestBuildingForRoom(roomPosition, buildings, rooms);
```

### Working with custom models
```typescript
import { getBuildingModelPath, hasCustomModel, groupBuildingsByModel } from "@/utils/buildingModels";

// Get model path for a building
const modelPath = getBuildingModelPath(building);

// Check if building uses custom model
const isCustom = hasCustomModel(building);

// Group buildings by their model type
const buildingsByModel = groupBuildingsByModel(buildings);
```

## Visual Representation

- **Buildings with rooms**: Display with reduced opacity (0.1) and show room count
- **Buildings without rooms**: Display with normal opacity (0.2)
- **Rooms**: Display with full opacity (1.0) and show room name on hover
- **Custom Models**: Buildings can use different 3D models for visual variety
- **Click behavior**: 
  - Clicking a building navigates to the building
  - Clicking a room navigates to the room (passing both building and room IDs)

## Current Data

- **Main Hospital Building** (`8e99cb47-93dd-40ee-aa8e-583e71b35382`): Contains 6 rooms
  - Kasir (2 rooms)
  - Casemix
  - Server
  - Gudang RM
  - RM

All other buildings currently have `hasRooms: false` and no associated rooms. Some buildings now use custom models for visual variety. 