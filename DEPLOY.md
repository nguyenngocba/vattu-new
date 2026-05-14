# SteelTrack Deploy Notes

## Safe test deploy

```bash
cd /var/www/steeltrack_refactor_test
npm install --ignore-scripts
npm run check
PORT=3001 pm2 start server.js --name steeltrack-test --update-env
pm2 logs steeltrack-test --lines 100
```

Open:

```text
http://vattu.trivietsteel.local:3001
```

## Production switch

Backup first:

```bash
cp -a /var/www/steeltrack /var/www/steeltrack_backup_$(date +%Y%m%d_%H%M)
```

Then deploy the tested code into `/var/www/steeltrack` and restart:

```bash
cd /var/www/steeltrack
npm install --ignore-scripts
npm run check
pm2 restart steeltrack --update-env
pm2 logs steeltrack --lines 100
```

## Environment

The app reads these variables when present:

```bash
PORT=3000
PGHOST=/var/run/postgresql
PGDATABASE=steeltrack
PGUSER=postgres
PGPORT=5432
REDIS_URL=redis://127.0.0.1:6379
UPLOAD_ROOT=/var/www/steeltrack/uploads
```

`UPLOAD_ROOT` defaults to `/var/www/steeltrack/uploads`, so test builds can still read existing production upload paths unless you override it.

## Smoke tests

```bash
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:3000/api/data
curl http://127.0.0.1:3000/api/forecast
```

Then test in browser:

- Login
- Dashboard forecast
- Materials
- Purchase, usage, return
- Structures
- Project structure export and return
- Upload attachment
