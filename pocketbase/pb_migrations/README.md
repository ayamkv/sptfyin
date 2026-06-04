# Migrations folder

This folder contains committed PocketBase schema migrations used by local development and backend deploys.

## How to set up

1. Start local PocketBase:

   ```bash
   cd pocketbase
   ./pocketbase.exe serve
   ```

2. Create an admin account at `http://127.0.0.1:8090/_/`

3. Confirm the expected collections exist after startup.

If the local database does not apply the committed migrations cleanly, export the current collections from production PocketBase admin:

- Go to `https://pb.sptfy.in/_/`
- Settings > Export collections
- Download the JSON file

Then import locally:

- Settings > Import collections
- Upload the exported JSON file
- Review and confirm the import

After local schema changes, export or commit the generated migration files in this folder.

## Note

Production is pinned to the PocketBase version in `docker-compose.yml`. Avoid generating migrations with a newer PocketBase binary unless the production image is upgraded in the same change.
