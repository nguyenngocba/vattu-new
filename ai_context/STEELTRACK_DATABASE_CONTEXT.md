# SteelTrack Database Context

Last updated: 2026-05-18

## Purpose

This document summarizes the current PostgreSQL database for SteelTrack so another AI agent can understand the data model before continuing the React migration or Smart Yard design work.

The database is currently used by:

- Existing Express backend
- Old HTML/CSS/JS frontend
- New `frontend-react` app via existing `/api/*` routes

## Database Connection

Backend connection file:

```text
server/db.js
```

Default connection:

```text
host: /var/run/postgresql
database: steeltrack
user: postgres
port: 5432
```

## Exported Files

The following database export files were generated in:

```text
/var/www/steeltrack/ai_context
```

Files:

```text
schema_latest.sql
database_full_dump.sql
database_data_only.sql
db_columns.tsv
db_constraints.tsv
db_indexes.tsv
db_row_counts.tsv
db_row_counts_estimated.tsv
db_transaction_type_summary.tsv
db_transaction_year_summary.tsv
db_transaction_month_summary.tsv
db_material_category_summary.tsv
db_samples_sanitized.json
STEELTRACK_DATABASE_CONTEXT.md
```

Important:

- `database_full_dump.sql` contains full data and may include sensitive user data.
- `db_samples_sanitized.json` redacts passwords and attachment payloads for safer AI sharing.
- Prefer sharing `schema_latest.sql`, `db_*.tsv`, `db_samples_sanitized.json`, and this document with external AI.
- Share `database_full_dump.sql` only in trusted/local contexts.

## Tables

Current public tables:

```text
categories
logs
materials
project_material_usage
project_schedules
projects
structure_materials
structure_warehouse
structures
suppliers
sw_logs
transactions
units
users_table
```

## Row Counts

Exact counts at export time:

```text
categories                8
logs                      160
materials                 20
project_material_usage    470
project_schedules         3
projects                  40
structure_materials       90
structure_warehouse       3
structures                30
suppliers                 30
sw_logs                   3
transactions              1252
units                     7
users_table               2
```

## Core Business Tables

### materials

Main warehouse material stock.

Key columns:

```text
id      varchar(50) primary key
name    varchar(200) not null
cat     varchar(100)
unit    varchar(20)
qty     numeric(20,3) default 0
cost    numeric(20,2) default 0
low     integer default 5
note    text default ''
```

Important:

- `qty` is current main warehouse stock.
- `low` is low-stock threshold.
- `cost` is unit cost.
- Check constraint: `qty >= 0`.

Used by:

- Inventory list
- Purchase/usage/return transactions
- Material transfer to structure warehouse
- Dashboard inventory value
- BOM material reference

### projects

Construction projects.

Key columns:

```text
id       varchar/text primary key
name     text/varchar
budget   numeric
spent    numeric
```

Important:

- `budget` is project budget.
- `spent` is accumulated material/structure usage cost.
- Used by material export and structure export workflows.

### suppliers

Suppliers.

Key columns:

```text
id
name
phone
email
address
```

Used by:

- Purchase transactions
- Supplier list/detail
- Future supplier rating and lead-time analytics

### transactions

Central operational log for stock and structure movements.

Key columns:

```text
id             varchar(50) primary key
mid            varchar(50)
supplier_id    varchar(50)
project_id     varchar(50)
date           date
datetime       timestamp
type           varchar(20)
qty            numeric(20,3)
unit_price     numeric(20,2)
vat_rate       numeric(5,1)
subtotal       numeric(20,2)
vat_amount     numeric(20,2)
total_amount   numeric(20,2)
note           text
attachment     text
invoice_image  text
```

Allowed `type` values:

```text
purchase
usage
return
produce
structure_export
structure_return
transfer_sw
return_from_sw
```

Important:

- For material transactions, `mid` references material id.
- For structure production/export/return, `mid` may reference structure id.
- There are indexes for `datetime`, `mid`, `type`, `project_id`, `supplier_id`.
- `attachment` stores serialized file metadata.

### structures

Finished or producible steel components.

Key columns:

```text
id          text primary key
name        text not null
unit        text default 'cái'
qty         numeric default 0
cost        numeric default 0
note        text default ''
type        text
zone        text
position_x  integer
position_y  integer
layer       integer default 1
rotation    numeric default 0
length      numeric default 6
width       numeric default 1.2
height      numeric default 0.8
weight      numeric default 1200
project_id  text
```

Important:

- `qty` is current structure stock.
- `zone`, `position_x`, `position_y`, `layer`, `rotation`, `length`, `width`, `height`, `weight` are early Smart Yard fields.
- Check constraint: `qty >= 0`.
- Referenced by `structure_materials`.

### structure_materials

BOM table for structures.

Key columns:

```text
id
structure_id references structures(id) on delete cascade
material_id
material_name
unit
quantity
```

Important:

- A row defines required material quantity per one structure unit.
- Production reads this table.
- Production consumes stock from `structure_warehouse`, not from `materials`.

### structure_warehouse

Intermediate warehouse for materials transferred from main stock to component production stock.

Key columns:

```text
material_id primary key
material_name
unit
qty
cost
```

Important:

- `material_id` links to original material.
- Main material stock decreases when transferred here.
- Structure production consumes from here.
- Return-to-main moves qty back to `materials`.

### sw_logs

History log for structure warehouse transfer/return operations.

Key columns:

```text
id
material_id
material_name
qty
unit
cost
note
attachment
type
created_at
```

Types:

```text
transfer_to_sw
return_to_main
```

Important:

- `qty` may be positive or negative depending on operation.
- React currently displays this as Kho CK history.

### project_material_usage

Project/material usage aggregate table.

Key:

```text
primary key (project_id, material_id)
```

Important:

- Tracks material usage by project.
- Useful for future project workspace.

### project_schedules

Project schedule/planning data.

Important:

- Existing schedule feature from old app.
- React has not migrated schedule UI yet.

### categories / units

Master data for material categories and units.

React Settings page can edit these lists.

### users_table

User table.

Key columns:

```text
id
name
username unique
password
role
permissions jsonb
```

Important:

- Full dump may contain password values.
- Use redacted samples when sharing with external AI.
- Current React login calls existing `/api/login`.

## Current Data Shape

The current sample data is a cleaned test dataset:

- 20 materials
- 30 suppliers
- 40 projects
- 30 structures
- 1252 transactions
- Data spans 2023-2026
- 2026 currently has data only through the current test period, not full future-year real data

## Transaction Summary

By transaction type:

```text
purchase          347   total_amount 138,470,942,084.15   total_qty 903,776.826
usage             855   total_amount 106,909,196,547.25   total_qty 823,910.466
return            17    total_amount 934,090,617.30       total_qty 403.885
structure_export  30    total_amount 1,770,000,000.00     total_qty 120.000
transfer_sw       3     total_amount 0.00                 total_qty 32.455
```

By year:

```text
2023 purchase 113  40,965,878,196.54
2023 return   6    261,893,448.72
2023 usage    259  28,104,992,334.46

2024 purchase 96   34,934,489,537.91
2024 return   1    111,914,224.63
2024 usage    249  31,353,681,281.29

2025 purchase          95   34,706,382,324.42
2025 return            8    320,797,789.78
2025 structure_export  30   1,770,000,000.00
2025 usage             247  31,669,597,048.80

2026 purchase     43   27,864,192,025.28
2026 return       2    239,485,154.17
2026 transfer_sw  3    0.00
2026 usage        100  15,780,925,882.70
```

Monthly breakdown is exported to:

```text
db_transaction_month_summary.tsv
```

## Material Category Summary

```text
Ống thép          2 items  stock_value 9,065,062,981.80  low_count 0
Bu lông - Ốc vít 3 items  stock_value 2,675,877,012.00  low_count 0
Thép hình         4 items  stock_value 2,052,826,989.10  low_count 1
Thép hộp          3 items  stock_value 1,936,883,163.00  low_count 0
Sơn - Chống gỉ    2 items  stock_value 1,322,702,100.00  low_count 1
Vật tư hàn cắt    3 items  stock_value 523,279,518.00    low_count 0
Thép tấm          3 items  stock_value 289,202,542.45    low_count 3
```

## Core Workflows

### Purchase Material

1. User creates `purchase` transaction.
2. Backend increases `materials.qty`.
3. Backend records `transactions`.
4. Supplier id may be set.
5. Attachments are stored as serialized metadata.

### Use/Export Material To Project

1. User creates `usage` transaction.
2. Backend checks material stock.
3. Backend decreases `materials.qty`.
4. Backend increases project spent/usage.
5. Backend records `transactions`.

### Return Material

1. User creates `return` transaction.
2. Backend increases `materials.qty`.
3. Backend records `transactions`.

### Transfer Material To Structure Warehouse

1. User selects materials from main warehouse.
2. Backend checks `materials.qty`.
3. Backend decreases `materials.qty`.
4. Backend upserts `structure_warehouse.qty`.
5. Backend writes `sw_logs`.
6. Backend writes transaction type `transfer_sw`.

### Return Material From Structure Warehouse

1. User selects material in `structure_warehouse`.
2. Backend checks `structure_warehouse.qty`.
3. Backend decreases `structure_warehouse.qty`.
4. Backend increases `materials.qty`.
5. Backend writes `sw_logs`.
6. Backend writes transaction type `return_from_sw`.

### Produce Structure

1. User selects structure and quantity.
2. Backend reads `structure_materials` BOM.
3. For each BOM item:
   - required qty = BOM quantity * production quantity
   - backend checks `structure_warehouse.qty`
   - backend subtracts from `structure_warehouse`
4. Backend increases `structures.qty`.
5. Backend records transaction type `produce`.

### Export Structure To Project

1. User selects structure, project, quantity.
2. Backend decreases `structures.qty`.
3. Backend updates project usage/spent.
4. Backend records `structure_export`.

### Return Structure From Project

1. User selects structure/project/quantity.
2. Backend increases `structures.qty`.
3. Backend records `structure_return`.

## Important API Coupling

React frontend currently uses existing backend routes and should continue doing so.

Common routes:

```text
GET    /api/data
POST   /api/login
POST   /api/materials
DELETE /api/materials/:id
POST   /api/projects
DELETE /api/projects/:id
POST   /api/suppliers
DELETE /api/suppliers/:id
POST   /api/transactions
POST   /api/structures
DELETE /api/structures/:id
POST   /api/produce-structure
POST   /api/export-structure
POST   /api/return-structure
GET    /api/structure-warehouse
POST   /api/transfer-to-structure-warehouse
POST   /api/return-from-sw
GET    /api/sw-logs/:mid
POST   /api/categories
POST   /api/units
POST   /api/upload/:type/:id
POST   /api/move-file
```

## Known Database Risks

### Mixed naming

Backend and frontend use mixed naming:

```text
supplier_id / supplierId
project_id / projectId
unit_price / unitPrice
total_amount / totalAmount
position_y / positionY
```

React currently normalizes some of this in:

```text
frontend-react/src/services/api.ts
```

### Weak foreign keys

Some logical relations are not enforced by FK constraints. Example:

- `transactions.mid` can point to material id or structure id depending on `type`.
- `transactions.project_id` and `supplier_id` are indexed but not necessarily FK-enforced.

AI should be careful when changing schema or query assumptions.

### Current stock vs historical stock

`materials.qty` and `structures.qty` are current stock snapshots.

Dashboard filtering by month/year must not blindly use current qty as historical stock for every period.

For historical period reporting:

- Use transactions within period for imports/exports/returns.
- For stock at a date, compute from current stock backwards or build a proper stock ledger/snapshot strategy.
- This was a known dashboard issue in the old UI.

### Structure warehouse is separate stock

Do not confuse:

```text
materials.qty
structure_warehouse.qty
structures.qty
```

They represent three different stock layers:

1. Main material warehouse
2. Material stock reserved/available for component production
3. Finished component stock

### Users table

`users_table.password` may contain sensitive values. Do not expose in UI or AI prompts unless intentionally local/trusted.

### Attachments

Attachments are serialized text, usually JSON-like arrays of files. Some older rows may be empty strings or inconsistent.

Frontend should parse defensively.

## Smart Yard Fields Already Present

The `structures` table already has early yard metadata:

```text
zone
position_x
position_y
layer
rotation
length
width
height
weight
project_id
```

These are enough for:

- A-K / 1-50 grid preview
- Stack layer display
- Basic position search

They are not enough for full spatial engine yet.

Future Smart Yard will likely need:

```text
yard_zones
yard_cells
component_positions
component_position_history
stack_rules
yard_events
yard_reservations
logistics_jobs
```

Do not add these until architecture is designed.

## Recommended Next Database Work

Do not aggressively refactor now.

Recommended safe steps:

1. Keep existing tables stable while React migration continues.
2. Add read-only APIs if React workspace needs richer detail queries.
3. Only add new tables for Smart Yard after renderer/spatial architecture is designed.
4. Consider stock ledger/snapshot design before building advanced historical dashboard.
5. Consider formal FKs later, but only after checking old data consistency.

## Files To Share With AI

Best context bundle:

```text
STEELTRACK_AI_HANDOFF.md
STEELTRACK_DATABASE_CONTEXT.md
schema_latest.sql
db_columns.tsv
db_constraints.tsv
db_indexes.tsv
db_row_counts.tsv
db_transaction_type_summary.tsv
db_transaction_year_summary.tsv
db_transaction_month_summary.tsv
db_material_category_summary.tsv
db_samples_sanitized.json
api_routes.txt
module_analysis.md
yard_vision.md
```

Only share this if the AI is trusted/local:

```text
database_full_dump.sql
database_data_only.sql
```

