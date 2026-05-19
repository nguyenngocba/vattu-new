# Smart Component Yard Operating System Vision

## Goal

Transform SteelTrack's component module from a list-based structure inventory into a Smart Component Yard Operating System for steel fabrication yards.

The system should answer:

- Which component exists?
- Where is it physically located?
- Which zone/cell/layer is it in?
- Which project does it belong to?
- Is the stack valid?
- Which yard areas are full, crowded, reserved, or available?
- How quickly can logistics find and dispatch components?

## Core Concepts

### Warehouse/Yard Map

- Yard grid with industrial coordinates.
- Current concept: columns A-K and rows 1-50.
- Future map should support custom zone definitions and real dimensions.
- Map must support pan, zoom, selection, highlighting, and heatmap overlays.

### Spatial Management

Each component placement should eventually track:

- component_id
- zone
- position_x
- position_y
- width
- length
- height
- rotation
- layer
- stack_id
- project_id
- status
- reserved_until or dispatch_plan_id

### Stack Layer

Stack rules:

- Compatible types can stack.
- Max layer count.
- Max height.
- Max load/weight per cell or stack.
- Warning for mixed incompatible components.
- Warning for blocked components needed for imminent dispatch.

### Occupancy Tracking

Occupancy should support:

- Empty cells.
- Occupied cells.
- Reserved cells.
- Full/congested cells.
- Dispatching/in-transit cells.
- Heatmap for density and congestion.

### Realtime Yard Visualization

Realtime should eventually update:

- Component produced and placed.
- Component moved.
- Component reserved for project.
- Component dispatched.
- Stack warning.
- Zone congestion.

### Zoomable Industrial Map

Zoom levels:

1. Yard overview.
2. Zone/cluster.
3. Area/cell.
4. Meter-level grid.
5. Component stack/detail.

### Drag And Drop Placement

Future behavior:

- Drag component to yard.
- Snap to grid or meter.
- Validate collision.
- Validate stack rules.
- Preview valid/invalid placement.
- Commit placement transaction.

### Logistics Tracking

Future logistics:

- Dispatch queue by project.
- Crane/forklift pickup route.
- Loading bay coordination.
- Components marked as reserved, staging, loading, dispatched.

### Component Search Highlight

Search should:

- Find by component code, name, type, project, or yard position.
- Zoom to component.
- Highlight selected component.
- Dim unrelated components.
- Show top view and side stack view.

### Top/Side View

- Top view: XY footprint, occupancy, collision, route.
- Side view: layer, stack height, component ordering.

## Rendering Direction

### Do Not Render Yard Objects With React

React should control:

- App shell.
- Sidebar.
- Toolbar.
- Filters.
- Tables.
- Right panels.
- Dialogs/forms.

### Use PixiJS Later

PixiJS should control:

- Yard rendering.
- Component sprites/shapes.
- Viewport pan/zoom.
- Selection/highlight.
- Heatmap.
- Drag/drop.
- Chunk rendering.

Recommended future libraries:

- `pixi.js`
- `pixi-viewport`
- Optional spatial helpers such as RBush or custom grid index.

## Spatial Indexing

Future engine should maintain a spatial index:

- Grid/chunk index for broad-phase lookup.
- Object bounds per component.
- Stack index per cell/zone.
- Fast hit testing for mouse/touch.
- Fast viewport query for visible objects only.

## Performance Strategy

- Keep React out of high-frequency rendering.
- Use PixiJS ticker or requestAnimationFrame for map layer.
- Batch static grid/background layers.
- Use viewport culling.
- Use LOD rules: hide labels/icons at far zoom, show details at close zoom.
- Keep selection state minimal and synchronized with React panel state.

## Future Crane Routing

Later roadmap:

- Define yard lanes and loading bays.
- Compute route from crane/forklift current point to component and loading bay.
- Warn blocked route.
- Estimate dispatch time.
- Sequence loading by project priority.

## Phased Plan

### Phase 1: Application Shell

- Build React/TypeScript/Vite architecture.
- AppLayout, Sidebar, Topbar, RightPanel.
- Placeholder pages.
- Dark industrial UI.

### Phase 2: API Service Layer

- Wrap existing Express endpoints.
- Add typed DTOs.
- Use React Query.

### Phase 3: Component Workspace UI

- List/table.
- Detail right panel.
- Tabs: overview, BOM, production, yard, logistics.

### Phase 4: Yard Engine Design

- Define data contracts.
- Define placement table and placement history.
- Define validation rules.
- No heavy renderer yet.

### Phase 5: PixiJS Renderer Prototype

- Render zones/grid/components.
- Pan/zoom/select.
- Search highlight.

### Phase 6: Placement And Stack Engine

- Drag/drop.
- Collision.
- Stack validation.
- Occupancy writeback.

### Phase 7: Realtime Operations

- Sync production/export/move events.
- Multi-user map updates.
- Dispatch queue.

