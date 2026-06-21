# Disable scraper workflow (step A)

The scheduled scraper was overwriting `data/` with the **old** per-university folder layout. Apply this fix to the data repo:

```bash
cd path/to/university-course-data
# Replace .github/workflows/run.yml with the version in this folder
cp ../assignment-help/patches/university-course-data-run.yml .github/workflows/run.yml
git add .github/workflows/run.yml
git commit -m "Disable scheduled scraper until index.json migration"
git push
```

Or copy from `patches/university-course-data-run.yml` in this project.

What changed:
- Removed daily `cron: '0 3 * * *'` schedule
- Replaced scrape/push steps with a fail-fast message so manual runs cannot recreate old folders
