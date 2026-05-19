# SteelTrack Module Analysis

## High-Level Architecture

The current app is a monolithic Express application with modular route files and a plain JavaScript frontend split into modules. The backend is relatively stable and should remain the source of truth for business workflows. The frontend is functional but has heavy coupling through global state, global functions, and inline event handlers.

## Existing Module Groups

### Backend

- `server/db.js`: PostgreSQL pool and transaction helper.
- `server/realtime.js`: Socket.IO and Redis adapter setup.
- `server/routes/index.js`: route registration.
- `server/routes/auth.js`: login.
- `server/routes/data.js`: full application data snapshot.
- `server/routes/materials.js`: material CRUD.
- `server/routes/transactions.js`: import/export/return material transactions.
- `server/routes/projects.js`: projects and schedules.
- `server/routes/suppliers.js`: suppliers.
- `server/routes/structures-basic.js`: structure CRUD and BOM persistence.
- `server/routes/structure-production.js`: produce structures from BOM.
- `server/routes/structure-warehouse.js`: transfer material to/from structure warehouse.
- `server/routes/structure-export-return.js`: export/return structures to/from projects.
- `server/routes/uploads.js`: upload handling.
- `server/routes/forecast.js`: forecasting endpoints.

### Frontend Desktop

- `js/app.js`: app shell, panes, topbar/sidebar composition.
- `js/modules/state.js`: shared state, load/save, modal helpers.
- `js/modules/auth.js`: login and sidebar.
- `js/modules/materials.js`: inventory management and material workspace.
- `js/modules/transactions.js`: stock transactions.
- `js/modules/import.js`: Excel import preview and validation.
- `js/modules/projects.js`: project module.
- `js/modules/suppliers.js`: supplier module.
- `js/modules/structures.js`: component/structure module and current yard prototype.
- `js/modules/charts.js`: desktop dashboard/reporting.
- `js/modules/utils.js`: shared formatting/input/file helpers.

### Frontend Mobile

- `js/mobile/mobile_shell.js`: mobile shell and detail modals.
- `js/mobile/mobile_home.js`: mobile home.
- `js/mobile/mobile_dashboard*.js`: mobile dashboard rendering/data/chart logic.
- `js/mobile/mobile_stock.js`: mobile stock.
- `js/mobile/mobile_transactions.js`: mobile transactions.
- `js/mobile/mobile_forms.js`: mobile import/export/return forms.
- `js/mobile/mobile_files.js`: mobile file helpers.
- `js/mobile/mobile_icons.js`: mobile icon helpers.

### CSS

- `css/style.css`: import entry.
- `css/desktop/*.css`: desktop split CSS.
- `css/mobile/*.css`: mobile split CSS.

## Dependency Coupling

- `state.data` is a shared mutable object used by almost all frontend modules.
- Many modules expose behavior through `window.*`.
- Many HTML snippets use inline `onclick`.
- Data refresh is mostly full snapshot through `/api/data`.
- Desktop and mobile share backend data but have separate frontend rendering paths.
- Dashboard/reporting code touches materials, transactions, projects, suppliers, and structures at the same time.

## Dangerous Areas for AI Modifications

- `js/modules/charts.js`: large reporting file with many cross-module calculations. Small mistakes can break dashboard tabs.
- `js/modules/state.js`: central hydration and modal utilities. Changes can break all modules.
- `js/modules/materials.js`: inventory CRUD, drawer/workspace, import/export actions, file context. High regression risk.
- `js/modules/structures.js`: currently being evolved and has production/export/BOM/yard logic in one file.
- `server/routes/transactions.js`, `server/routes/structure-production.js`, `server/routes/structure-export-return.js`: stock-moving routes must preserve transactional integrity.
- Database schema changes: should be additive and backward compatible.

## Modules That Should Stay Isolated

- Mobile modules should stay isolated from desktop changes unless the task explicitly targets mobile.
- Backend stock transaction routes should stay isolated from UI-only work.
- Upload routes should not be modified by UI layout tasks.
- Dashboard calculations should not be changed while building CRUD layouts unless necessary.

## Safe Areas for Windsurf

Windsurf can safely work on:

- New React/Vite shell scaffolding.
- UI layout components.
- Sidebar/topbar/right panel.
- Placeholder pages.
- Reusable card/table/form components.
- Dark industrial styling.
- API client wrappers around existing routes.
- CRUD screens that call existing backend routes.
- Story-level UI polish once behavior is defined.

Windsurf should avoid:

- Spatial engine design.
- PixiJS rendering core.
- Occupancy algorithms.
- Stack validation rules.
- Concurrency and stock transaction logic.
- Large edits in existing production JS without narrow scope.

## Areas Requiring Codex Architecture Oversight

- Future PixiJS renderer architecture.
- Yard data model design.
- Spatial indexing and chunking.
- Viewport culling and LOD.
- Occupancy and stack validation engines.
- Realtime synchronization semantics.
- Drag/drop placement conflict resolution.
- Database model for component placement history.
- Performance strategy for thousands of yard objects.

## Recommended Migration Strategy

1. Freeze backend as business-logic reference.
2. Build new React/TypeScript/Vite app shell side-by-side.
3. Create API service layer for existing Express routes.
4. Migrate low-risk pages first: dashboard shell, suppliers, projects list.
5. Migrate inventory list/workspace after service layer stabilizes.
6. Migrate component workspace UI.
7. Only then design final yard engine as separate package/module.
8. Keep PixiJS renderer independent from React component tree.

## Current Smart Yard Status

The current production frontend has a first-pass yard prototype:

- Canvas map in structures module.
- Grid A-K x 1-50.
- Search/highlight.
- Component workspace tabs.
- Basic stack/warning rules.

This prototype is useful for validating UX and data needs. It should not be treated as final rendering architecture.

