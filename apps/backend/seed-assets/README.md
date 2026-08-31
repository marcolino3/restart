# Seed assets

Data files the Testschule seed needs at runtime. They live in the repository
(and therefore in the backend image) because the seed also runs inside the
cluster, where `~/Downloads` does not exist.

## `curriculum/`

The Montessori curriculum sheets imported by `seedCurriculaFromXlsx()` in
`scripts/seed-testschule-large.ts`. The seed resolves them via
`SEED_CURRICULA_DIR`, looking for `<dir>/curriculum/*Kindergarten*.xlsx` and
`<dir>/curriculum/*Primarschule*.xlsx`.

- Locally the variable is unset and the seed falls back to `~/Downloads`.
- `src/reset-staging.ts` points it at this directory.

If the files are missing the import is skipped with a warning; the rest of the
school data is still created.
