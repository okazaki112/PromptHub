# Delta Spec

## Modified

- WebDAV `pull` fallback may only treat `404` as "backup missing". Authentication, authorization, connectivity, and server failures must remain diagnostically visible to clients.
- WebDAV structured backups on web must remain recoverable snapshots, including referenced media files for prompts.
- When web writes structured WebDAV backups, `manifest.json` is part of the success contract. A failed manifest upload means the sync operation failed.
- Web sync clients must treat unified `summary` as the stable response surface for `PUT /sync/data`, `POST /sync/push`, and `POST /sync/pull`.

## Scenarios

- Scenario: WebDAV auth failure during pull
  - Given the remote WebDAV endpoint returns `401`
  - When the web sync route executes `POST /sync/pull`
  - Then the route returns a validation-style sync error with the HTTP 401 context intact
  - And it does not rewrite the error as "no backup found"

- Scenario: WebDAV push misses manifest upload
  - Given `data.json` upload succeeds but `manifest.json` upload fails
  - When the web sync route executes `POST /sync/push`
  - Then the operation fails
  - And `lastSyncAt` is not advanced as if the backup were complete

- Scenario: WebDAV backup with prompt media
  - Given prompts reference image and video files that exist in the workspace
  - When the web sync route pushes to WebDAV
  - Then the remote backup contains `data.json`, `manifest.json`, and the referenced media payloads
  - And a later pull restores both prompt records and their media files
