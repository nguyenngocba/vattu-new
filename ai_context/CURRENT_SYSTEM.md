# SteelTrack Current System

## Purpose

SteelTrack is a steel warehouse and project/material management system that is being evolved toward a Smart Component Yard Operating System. The current production app is still the source of business logic and should remain online while a future React/TypeScript frontend is built incrementally.

## Frontend Stack

- Current frontend: plain HTML/CSS/JavaScript modules.
- Desktop entry: `js/app.js`.
- Desktop modules: `js/modules/*.js`.
- Mobile modules: `js/mobile/*.js`.
- CSS entry: `css/style.css`.
- Desktop CSS has been split into `css/desktop/*.css`.
- Mobile CSS has been split into `css/mobile/*.css`.

## Backend Stack

- Node.js + Express 5.
- PostgreSQL via `pg`.
- File uploads via `multer`.
- Socket.IO realtime notifications.
- Redis adapter is attempted for Socket.IO, but system can run when Redis adapter is offline.

## Database

- PostgreSQL database: `steeltrack`.
- Schema export: `ai_context/schema.sql`.
- Main tables include materials, transactions, projects, suppliers, structures, structure_materials, structure_warehouse, users_table, logs, categories, units, project_schedules, project_material_usage.
- The `structures` table has been extended for early yard metadata: `type`, `zone`, `position_x`, `position_y`, `layer`, `rotation`, `length`, `width`, `height`, `weight`, `project_id`.

## Authentication

- Login route: `POST /api/login`.
- Users are stored in `users_table`.
- Current auth is simple username/password database check.
- Client stores current user in local storage.
- This is acceptable for local/internal demo, but should be hardened before public deployment.

## Realtime

- `server/realtime.js` creates Socket.IO server.
- `notifyAll(event, data)` emits updates to all clients.
- Some routes notify `dataChanged` after writes.
- Not every module has complete realtime refresh semantics yet.

## Deployment

- App is served by Express from project root.
- Current package scripts:
  - `npm start`
  - `npm run check`
  - `npm run test:mobile`
  - `npm run seed:demo`

## Existing Modules

- Inventory/materials: `js/modules/materials.js`, `server/routes/materials.js`.
- Transactions/import/export/return: `js/modules/transactions.js`, `js/modules/import.js`, `server/routes/transactions.js`.
- Projects: `js/modules/projects.js`, `server/routes/projects.js`.
- Suppliers: `js/modules/suppliers.js`, `server/routes/suppliers.js`.
- Components/structures: `js/modules/structures.js`, `server/routes/structures*.js`.
- Structure production: `server/routes/structure-production.js`.
- Structure warehouse: `server/routes/structure-warehouse.js`.
- Structure export/return: `server/routes/structure-export-return.js`.
- Dashboard/reporting: `js/modules/charts.js`, `js/modules/structure_dashboard.js`, `js/mobile/mobile_dashboard*.js`.
- Uploads: `server/routes/uploads.js`, `js/modules/uploads.js`.
- Settings/users/categories/units: `js/modules/settings.js`, `server/routes/settings.js`.

## Existing Workflows

- Create/edit/delete materials.
- Import Excel for materials.
- Purchase/import stock.
- Usage/export stock to project.
- Return material.
- Transfer material to structure warehouse.
- Produce structures from BOM using structure warehouse stock.
- Export structures to project.
- Return structures from project.
- Attach files to transactions.
- Dashboard filtering and reporting.
- Mobile app shell and mobile reporting pages.

## Completed Features Recently

- Mobile UI modularization and dashboard improvements.
- Desktop dark industrial dashboard direction.
- Inventory workspace/detail panel improvements.
- Activity feed relocation into sidebar area.
- File attachment transaction context in material workspace.
- Early Smart Component Yard foundation:
  - Yard grid A-K by 1-50.
  - Canvas-based yard map.
  - Component search/highlight.
  - Top/side view toggle.
  - Yard occupancy KPI.
  - Stack layer metadata.
  - Warning rules for load/layer/mixed stack.
  - Component Workspace tabs: overview, BOM, production, yard position, logistics.

## In-Progress Features

- Component module is transitioning from CRUD/list into Smart Component Yard workspace.
- Yard logic currently exists as a first frontend foundation, not a full spatial engine.
- Database has first-pass component yard columns, but no dedicated placement table yet.

## Planned Smart Yard System

- Separate React/TypeScript frontend shell.
- PixiJS renderer for large yard visualization.
- Spatial indexing for collision/selection/viewport culling.
- Occupancy engine.
- Stack validation engine.
- Drag/drop placement with snap grid.
- Zoom/pan industrial map.
- Heatmap and congestion display.
- Component search that zooms to highlighted component.
- Top view and side view.
- Logistics/crane route planning in later phases.

## Rendering Strategy

- Current yard map uses Canvas in `js/modules/structures.js`.
- This is only a prototype/bridge.
- Future yard renderer should be PixiJS + pixi-viewport.
- React should not render thousands of yard objects. React should own shell, toolbar, forms, panels, tables, and dialogs only.

## Current State Management

- Current app uses a global `state` object from `js/modules/state.js`.
- Most modules read/write `state.data`.
- `loadState()` hydrates data from `/api/data`.
- `saveState()` posts category/unit settings and module code performs direct API writes.
- Many UI actions are still exposed on `window.*` because inline `onclick` is widely used.

## Current API Structure

- Routes are registered in `server/routes/index.js`.
- Data snapshot: `GET /api/data`.
- Auth: `POST /api/login`.
- Materials: `POST /api/materials`, `DELETE /api/materials/:id`.
- Transactions: `POST /api/transactions`.
- Projects: project CRUD and schedules in `server/routes/projects.js`.
- Suppliers: supplier CRUD in `server/routes/suppliers.js`.
- Structures:
  - `GET /api/structures`
  - `POST /api/structures`
  - `DELETE /api/structures/:id`
  - `POST /api/produce-structure`
  - `POST /api/export-structure`
  - `POST /api/return-structure`
  - structure warehouse transfer/return routes.

## Known Risk Areas

- Frontend is still globally coupled through `window.*` and shared `state`.
- Inline `onclick` is common.
- Dashboard code is large and dense.
- Current auth is basic and should not be treated as enterprise security.
- Some backend routes use broad data snapshot patterns rather than granular API resources.
- The current Canvas yard prototype should not become the final engine.
- Any large AI edit in `js/modules/charts.js`, `js/modules/materials.js`, or `js/modules/structures.js` can cause regressions if not scoped and tested.

