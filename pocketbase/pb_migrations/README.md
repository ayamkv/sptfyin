# Migrations folder

This folder will be populated when you export/import schema from production PocketBase.

## How to set up

1. Export collections from production PocketBase admin:
   - Go to `https://pbbase.sptfy.in/_/`
   - Settings > Export collections
   - Download the JSON file

2. Start local PocketBase:

   ```bash
   cd pocketbase
   ./pocketbase.exe serve
   ```

3. Create admin account at `http://127.0.0.1:8090/_/`

4. Import the schema:
   - Settings > Import collections
   - Upload the JSON file from step 1

5. PocketBase will create the migration files automatically in this folder.

## Note

The original migrations from the VPS backup used PocketBase v0.22 API (`Dao`) which is
incompatible with v0.23+. That's why we need to re-export from the running production instance.
