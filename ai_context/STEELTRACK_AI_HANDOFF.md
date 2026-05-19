# SteelTrack AI Handoff

Last updated: 2026-05-18

## Purpose

SteelTrack is a steel structure warehouse and project management system. The current goal is to keep the existing production app running while gradually migrating the frontend to a new React architecture that can later become a Smart Component Yard Operating System.

This file is intended for GPT, Windsurf, Codex, or another AI agent that needs project context before continuing work.

## Current Strategy

The old system remains online and must not be broken.

The new system lives in:

```text
/var/www/steeltrack/frontend-react
```

The migration strategy is gradual:

1. Keep Express backend, PostgreSQL database, and existing API routes.
2. Build a new React + TypeScript frontend beside the old app.
3. Migrate UI and workflows module by module.
4. Validate after each batch.
5. Switch fully to React only after feature parity is close enough.
6. Remove old frontend later, not now.

## Tech Stack

### Existing Backend

- Express
- PostgreSQL
- Socket.io
- Existing REST API routes under `/api/*`
- File uploads already handled by old backend
- Old frontend still uses plain HTML/CSS/JS modules

### New Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query
- Zustand
- Socket.io client
- Lucide icons
- Future: PixiJS and pixi-viewport for yard renderer

## Important Rule

Do not rewrite the backend right now.

The backend is the source of business logic. The React frontend should call existing endpoints and adapt around them.

Do not implement the full spatial engine yet.

React should render:

- Shell
- Sidebar
- Topbar
- Tables
- Forms
- Modals
- Detail panels
- Dashboard cards
- Small/medium UI previews

PixiJS should later render:

- Large yard map
- Zoom/pan
- Many yard objects
- Heatmap
- Drag/drop placement
- Highlight/search
- Stack visualization
- LOD/chunk rendering

## New React Structure

Current important files:

```text
frontend-react/src/app/AppLayout.tsx
frontend-react/src/app/Sidebar.tsx
frontend-react/src/app/Topbar.tsx
frontend-react/src/app/RightPanel.tsx

frontend-react/src/pages/DashboardPage.tsx
frontend-react/src/pages/InventoryPage.tsx
frontend-react/src/pages/ComponentsPage.tsx
frontend-react/src/pages/YardPage.tsx
frontend-react/src/pages/ProjectsPage.tsx
frontend-react/src/pages/SuppliersPage.tsx
frontend-react/src/pages/LogisticsPage.tsx
frontend-react/src/pages/AnalyticsPage.tsx
frontend-react/src/pages/SettingsPage.tsx
frontend-react/src/pages/LoginPage.tsx

frontend-react/src/services/api.ts
frontend-react/src/services/excel.ts
frontend-react/src/services/useSteelTrackData.ts
frontend-react/src/services/RealtimeBridge.tsx

frontend-react/src/shared/DataTable.tsx
frontend-react/src/shared/DataState.tsx
frontend-react/src/shared/ExcelImportModal.tsx
frontend-react/src/shared/FileUploader.tsx
frontend-react/src/shared/FormField.tsx
frontend-react/src/shared/Modal.tsx
frontend-react/src/shared/PageHeader.tsx
frontend-react/src/shared/SelectField.tsx
frontend-react/src/shared/StatCard.tsx

frontend-react/src/stores/authStore.ts
frontend-react/src/stores/uiStore.ts

frontend-react/src/engine/README.md
```

## Current Routes in React

```text
/dashboard
/inventory
/components
/yard
/projects
/suppliers
/logistics
/analytics
/settings
```

Root redirects to `/dashboard`.

## API/Data Flow

Main data query:

```text
GET /api/data
```

React Query hook:

```text
frontend-react/src/services/useSteelTrackData.ts
```

Central API wrapper:

```text
frontend-react/src/services/api.ts
```

Realtime:

```text
frontend-react/src/services/RealtimeBridge.tsx
```

When backend emits `dataChanged`, React invalidates data queries.

## Existing Data Entities

Core entities currently used in React:

- `Material`
- `Project`
- `Supplier`
- `Structure`
- `StructureMaterial`
- `StructureWarehouseItem`
- `StructureWarehouseLog`
- `Transaction`
- `User`

Key data relation:

- `structures` are enriched in frontend with `structureMaterials` as `structure.materials`.
- Structure production uses BOM from `structure_materials`.
- BOM consumes materials from `structure_warehouse`, not directly from main material stock.

## Completed in React So Far

### Application Shell

Done:

- Dark industrial layout
- Sidebar navigation
- Topbar
- Right detail panel
- React Router
- React Query
- Zustand UI/auth stores
- Login/logout
- Protected shell behavior
- Realtime invalidation

### Dashboard

Done:

- Reads real `/api/data`
- KPI cards:
  - Total inventory value
  - Total stock
  - Low stock count
  - Project count
  - Structure count
- Recent transaction table
- Top inventory value table

Still missing:

- Full parity with old desktop dashboard
- Date range filter
- Month/year filter
- Trend percentage logic
- Big popup detail charts
- Supplier/project/component forecast cards
- Chart polish

### Inventory / Kho Vật Tư

Done:

- List materials
- Search/filter
- Low-stock status
- Create/edit/delete material
- Purchase transaction
- Usage/export transaction
- Return transaction
- File uploader for transactions
- Import Excel
- Export Excel
- RightPanel selection

Relevant APIs:

```text
GET /api/data
POST /api/materials
DELETE /api/materials/:id
POST /api/transactions
POST /api/upload/:type/:id
POST /api/move-file
```

Still missing:

- Rich detail workspace like old/new ERP concept
- Better row insight
- Favorite/pin
- Advanced filters
- Density control
- Bulk selection/actions
- Import progress/validation polish
- Material transaction history inside large workspace

### Structure Warehouse / Kho Cấu Kiện

Done inside `ComponentsPage`:

- Fetch structure warehouse:

```text
GET /api/structure-warehouse
```

- Transfer material from main warehouse to structure warehouse:

```text
POST /api/transfer-to-structure-warehouse
```

- Return material from structure warehouse to main warehouse:

```text
POST /api/return-from-sw
```

- View transfer/return logs:

```text
GET /api/sw-logs/:mid
```

- File attachments for transfer logs are shown.

Important logic:

- Main material qty decreases when transferred to structure warehouse.
- Structure warehouse qty increases.
- Returning does the reverse.
- Production consumes from structure warehouse based on BOM.

### Components / Cấu Kiện

Done:

- List structures
- Search/filter by yard zone
- Add/edit/delete structure
- Yard metadata fields:
  - zone
  - position_y
  - layer
  - weight
- Produce structure
- Export structure to project
- Return structure from project
- File upload for structure operations
- BOM editor in React form
- BOM saves to backend through existing `/api/structures`
- BOM cost is computed from selected material costs

Relevant APIs:

```text
POST /api/structures
DELETE /api/structures/:id
POST /api/produce-structure
POST /api/export-structure
POST /api/return-structure
```

Important production workflow:

1. User defines structure BOM.
2. User transfers materials to structure warehouse.
3. User produces structure.
4. Backend checks BOM and available structure warehouse stock.
5. Backend subtracts BOM material qty from structure warehouse.
6. Backend increases structure qty.
7. Transaction is recorded.

Still missing:

- Full Component Workspace tabs:
  - Overview
  - BOM
  - Production/QC
  - Yard Position
  - Logistics
  - Files
  - History
- Better detail panel
- QC timeline
- Production planning
- Better component analytics
- Drag/drop yard placement

### Yard Map

Done:

- Full A-K / 1-50 grid in React
- Search structures
- Filter by zone
- Occupancy KPI
- Layer-high KPI
- Click occupied cell to select structure in RightPanel
- Shows count per occupied cell

Important:

- This is only a bridge UI.
- It is not the final spatial engine.
- It should not be extended to render thousands of objects in React.

Future yard renderer should be in:

```text
frontend-react/src/engine
```

Future folders should be:

```text
src/engine/renderer
src/engine/spatial
src/engine/viewport
src/engine/simulation
```

### Projects / Công Trình

Done:

- List projects
- Add/edit/delete project
- Import Excel
- Export Excel
- RightPanel selection

Still missing:

- Project detail workspace
- Budget alerts
- Material usage per project
- Structure export history per project
- Schedule/progress migration

### Suppliers / Nhà Cung Cấp

Done:

- List suppliers
- Add/edit/delete supplier
- Import Excel
- Export Excel
- RightPanel selection

Still missing:

- Supplier detail workspace
- Rating
- Purchase history
- Lead time
- Price history
- Supplier performance dashboard

### Logistics

Done:

- Read-only feed from transactions:
  - material usage
  - material return
  - structure export
  - structure return
- Shows file links when available

Still missing:

- Dispatch queue
- Loading bay
- Vehicle/crane routing
- Delivery status
- Project delivery planning

### Analytics / Reports

Done:

- Basic summary from real transactions

Still missing:

- Proper dashboard parity
- Date/month/year filters
- Charts
- Forecast
- Category analysis
- Project/category/component spending analysis
- Popup chart detail

### Settings

Done:

- Users read-only
- Categories edit
- Units edit

Still missing:

- User management write flow
- Permission editing
- Theme system parity
- Audit log UI

### Excel

Done:

- Excel import/export added to React.
- Avoided `xlsx` package because `npm audit` reported high severity with no fix.
- Current packages:

```text
read-excel-file
write-excel-file
```

Excel implementation:

```text
frontend-react/src/services/excel.ts
frontend-react/src/shared/ExcelImportModal.tsx
```

Validation:

- Preview rows
- Valid rows
- Warning rows
- Error rows
- Template download

## Verification Commands

Always run after React changes:

```bash
cd /var/www/steeltrack/frontend-react
npm run build
npm run lint
npm audit --omit=dev
```

Always run after changes that might touch old app/backend/mobile:

```bash
cd /var/www/steeltrack
npm run check
npm run test:mobile
```

Latest known status:

```text
frontend-react npm run build: pass
frontend-react npm run lint: pass
frontend-react npm audit --omit=dev: pass, 0 vulnerabilities
root npm run check && npm run test:mobile: pass
```

## Workflow Summary

### Material purchase

1. User opens Kho vật tư.
2. User clicks Nhập kho.
3. User selects material and supplier.
4. User enters quantity, unit price, VAT, note, files.
5. React uploads temp files.
6. React moves files to final upload folder.
7. React posts `/api/transactions` with type `purchase`.
8. Backend updates material stock and transaction history.
9. React Query invalidates `/api/data`.

### Material usage/export

1. User opens Kho vật tư.
2. User clicks Xuất kho.
3. User selects material and project.
4. React posts transaction type `usage`.
5. Backend subtracts stock.
6. Backend updates project spending.
7. React refreshes data.

### Material return

1. User opens Kho vật tư.
2. User clicks Trả hàng.
3. User selects material and project.
4. React posts transaction type `return`.
5. Backend increases material stock.
6. React refreshes data.

### Transfer material to structure warehouse

1. User opens Cấu kiện.
2. User clicks Chuyển vật tư.
3. User selects one or more materials from main stock.
4. React validates qty against main stock.
5. React posts `/api/transfer-to-structure-warehouse`.
6. Backend subtracts main material qty.
7. Backend upserts `structure_warehouse`.
8. Backend writes `sw_logs`.
9. React refreshes `/api/data`, `/api/structure-warehouse`, and logs.

### Return material from structure warehouse

1. User opens Cấu kiện.
2. User finds item in Kho cấu kiện section.
3. User clicks Trả lại.
4. React validates qty against structure warehouse qty.
5. React posts `/api/return-from-sw`.
6. Backend subtracts structure warehouse qty.
7. Backend increases main material qty.
8. Backend writes transaction and `sw_logs`.

### Structure BOM

1. User opens Cấu kiện.
2. User adds/edits structure.
3. User adds BOM rows.
4. BOM row references material id from structure warehouse or material list.
5. React saves structure via `/api/structures`.
6. Backend deletes previous `structure_materials` for that structure.
7. Backend inserts new BOM rows.

### Produce structure

1. User opens Cấu kiện.
2. User clicks Sản xuất.
3. User selects structure and qty.
4. Backend reads structure BOM.
5. Backend checks `structure_warehouse` stock for each BOM item.
6. Backend subtracts required material qty.
7. Backend increases structure qty.
8. Backend writes transaction type `produce`.

### Export structure to project

1. User opens Cấu kiện.
2. User clicks Xuất CT.
3. User selects structure, project, qty.
4. Backend subtracts structure qty.
5. Backend updates project usage/spending.
6. Backend writes transaction type `structure_export`.

### Return structure from project

1. User opens Cấu kiện.
2. User clicks Trả CK.
3. User selects structure/project/qty.
4. Backend increases structure qty.
5. Backend writes transaction type `structure_return`.

## What To Do Next

Recommended next phases:

### Phase A - React Feature Parity

Priority:

1. Inventory detail workspace:
   - overview
   - transaction history
   - project usage
   - supplier history
   - file attachments
   - quick actions
2. Component workspace:
   - overview
   - BOM tab
   - production tab
   - yard position tab
   - logistics tab
   - history/files
3. Project workspace:
   - budget status
   - material usage
   - structure exports
   - warning when budget is exceeded
4. Supplier workspace:
   - purchase history
   - value imported
   - average price
   - rating placeholder
5. Dashboard parity:
   - date/month/year filters
   - trend percentages
   - charts
   - popup drilldowns

### Phase B - Smart Yard Preparation

Do not build PixiJS engine yet until UI/workflow parity is stronger.

Prepare only:

- Data model needs
- API shape
- engine boundary
- component position fields
- yard event model

### Phase C - Smart Yard Engine

Later, Codex should design:

- PixiJS renderer
- viewport controller
- spatial index
- occupancy grid
- stack validation
- drag/drop placement
- map search highlight
- top/side view
- heatmap
- realtime sync strategy

## Known Risk Areas

### Old frontend

The old app is still large and has many global functions. Do not delete or refactor it yet.

Important old paths:

```text
js/modules/mobile_view.js
js/mobile/*
js/modules/charts.js
js/modules/materials.js
js/modules/structures.js
js/modules/transactions.js
style.css
css/*
```

### Inline/global assumptions

The old app relies on many global `window.*` functions and inline handlers. React should not depend on those.

### Backend API shapes

Some backend routes use mixed naming:

- `supplier_id` vs `supplierId`
- `project_id` vs `projectId`
- `unit_price` vs `unitPrice`
- `total_amount` vs `totalAmount`
- `position_y` vs `positionY`

React currently normalizes some of this in `api.ts`.

### Date logic

Old dashboard logic had issues with:

- date order
- month/year range
- trend percentage correctness
- inventory value over selected period

When migrating dashboard, fix logic instead of copying blindly.

### Excel

Do not re-add `xlsx` unless the security advisory is intentionally accepted.

Current safer implementation uses:

```text
read-excel-file
write-excel-file
```

### React hooks

Keep hooks before any early return.

### Bundle size

Excel libraries are dynamically imported. Keep them lazy-loaded.

### Yard map

Current React yard grid is fine for A-K / 1-50 preview. Do not scale it to thousands of objects. Use PixiJS later.

## AI Agent Responsibilities

### Windsurf-style tasks

Safe:

- UI screens
- CRUD forms
- Tables
- Modals
- Detail workspaces
- API hooks
- Styling polish
- Import/export UI
- Dashboard cards/charts using existing data

Avoid:

- Spatial algorithms
- PixiJS core renderer
- Stack/collision engine
- Large backend/database refactor

### Codex-style tasks

Use for:

- Data architecture review
- API contract review
- Spatial engine design
- Performance-sensitive renderer
- Realtime sync strategy
- Migration safety checks
- Tests and verification

## Development Rules

1. Keep old app working.
2. Do not delete old frontend yet.
3. Do not rewrite backend.
4. Migrate one module/workflow at a time.
5. Prefer existing API routes.
6. Keep all new frontend code inside `frontend-react`.
7. Avoid global mutable state in React.
8. Use React Query for server state.
9. Use Zustand only for local UI/auth state.
10. Run build/lint/mobile checks after changes.

## Current Mental Model

SteelTrack is moving from:

```text
Inventory CRUD app
```

to:

```text
Steel Structure ERP Platform
```

and later:

```text
Smart Component Yard Operating System
```

The target is an industrial operating UI that combines:

- warehouse stock
- structure production
- project delivery
- supplier tracking
- logistics
- yard position map
- realtime activity
- analytics
- future digital twin yard renderer

