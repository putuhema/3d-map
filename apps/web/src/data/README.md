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
};
```

## Relationship Benefits

1. **Parent-Child Relationship**: Rooms are now logically grouped within their parent buildings
2. **Better User Experience**: Users can navigate to specific rooms within buildings
3. **Improved Interaction**: Different click behaviors for buildings vs rooms
4. **Data Organization**: More realistic representation of real-world relationships

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

## Visual Representation

- **Buildings with rooms**: Display with reduced opacity (0.1) and show room count
- **Buildings without rooms**: Display with normal opacity (0.2)
- **Rooms**: Display with full opacity (1.0) and show room name on hover
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

All other buildings currently have `hasRooms: false` and no associated rooms. 