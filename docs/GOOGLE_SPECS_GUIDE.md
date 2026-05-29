# Creating Google Coral Source Specs

This guide walks through creating Coral source specs for **Google Photos**, **Google Drive**, and **Gmail**. Coral v0.2.0 supports `backend: jsonl` for static data and `backend: csv` for CSV files, but connecting to live Google APIs requires custom tooling.

## Architecture Overview

```
Google APIs → Export Script → JSONL files → Coral Source Spec → coral sql
```

Coral v0.2.0 does not support HTTP-backed sources directly. To connect Google services, you export data as JSONL files via scripts, then point Coral specs at those files.

## Prerequisites

- Coral CLI v0.2.0+ installed
- Node.js 18+ for export scripts
- Google Cloud project with the relevant APIs enabled
- OAuth 2.0 credentials (Desktop application type)

## Step 1: Enable Google APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the APIs you need:
   - Google Photos Library API
   - Google Drive API
   - Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Desktop app
   - Download the `credentials.json` file
5. Add scopes (space-separated):
   - Photos: `https://www.googleapis.com/auth/photoslibrary.readonly`
   - Drive: `https://www.googleapis.com/auth/drive.readonly`
   - Gmail: `https://www.googleapis.com/auth/gmail.readonly`

## Step 2: Export Data to JSONL

Create an export script for each service. Example structure:

```
scripts/
  export-google-photos.ts
  export-google-drive.ts
  export-gmail.ts
```

### Google Photos Export

```typescript
// scripts/export-google-photos.ts
import { google } from "googleapis";
import { writeFileSync } from "fs";

async function exportGooglePhotos() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const photos = google.photoslibrary({ version: "v1", auth });
  const records: Record<string, unknown>[] = [];

  let nextPageToken: string | undefined;
  do {
    const res = await photos.mediaItems.search({
      requestBody: {
        pageSize: 100,
        pageToken: nextPageToken,
        filters: {
          dateFilter: {
            ranges: [{ startDate: { year: 2023, month: 1, day: 1 }, endDate: { year: 2025, month: 12, day: 31 } }]
          }
        }
      }
    });
    for (const item of res.data.mediaItems ?? []) {
      records.push({
        id: item.id,
        filename: item.filename,
        mime_type: item.mimeType,
        description: item.description,
        media_url: item.baseUrl,
        creation_time: item.mediaMetadata?.creationTime,
        width: item.mediaMetadata?.width ? parseInt(item.mediaMetadata.width) : null,
        height: item.mediaMetadata?.height ? parseInt(item.mediaMetadata.height) : null,
      });
    }
    nextPageToken = res.data.nextPageToken ?? undefined;
  } while (nextPageToken);

  writeFileSync("data/google_photos.jsonl", records.map(r => JSON.stringify(r)).join("\n"));
  console.log(`Exported ${records.length} photos`);
}

exportGooglePhotos().catch(console.error);
```

### Google Drive Export

```typescript
// scripts/export-google-drive.ts
import { google } from "googleapis";
import { writeFileSync } from "fs";

async function exportGoogleDrive() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const drive = google.drive({ version: "v3", auth });
  const records: Record<string, unknown>[] = [];

  let nextPageToken: string | undefined;
  do {
    const res = await drive.files.list({
      pageSize: 100,
      pageToken: nextPageToken,
      fields: "files(id, name, mimeType, size, createdTime, modifiedTime, owners/displayName, parents)",
      orderBy: "modifiedTime desc",
    });
    for (const file of res.data.files ?? []) {
      records.push({
        id: file.id,
        name: file.name,
        mime_type: file.mimeType,
        size_bytes: file.size ? parseInt(file.size) : null,
        created_time: file.createdTime,
        modified_time: file.modifiedTime,
        owner: file.owners?.[0]?.displayName,
      });
    }
    nextPageToken = res.data.nextPageToken ?? undefined;
  } while (nextPageToken);

  writeFileSync("data/google_drive.jsonl", records.map(r => JSON.stringify(r)).join("\n"));
  console.log(`Exported ${records.length} files`);
}

exportGoogleDrive().catch(console.error);
```

### Gmail Export

```typescript
// scripts/export-gmail.ts
import { google } from "googleapis";
import { writeFileSync } from "fs";

async function exportGmail() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const gmail = google.gmail({ version: "v1", auth });
  const records: Record<string, unknown>[] = [];

  let nextPageToken: string | undefined;
  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100,
      pageToken: nextPageToken,
      q: "after:2023/01/01",
    });
    for (const msg of res.data.messages ?? []) {
      const detail = await gmail.users.messages.get({ userId: "me", id: msg.id! });
      const headers = detail.data.payload?.headers ?? [];
      const subject = headers.find(h => h.name === "Subject")?.value ?? "";
      const from = headers.find(h => h.name === "From")?.value ?? "";
      const date = headers.find(h => h.name === "Date")?.value ?? "";

      records.push({
        id: msg.id,
        thread_id: detail.data.threadId,
        subject,
        from,
        date,
        snippet: detail.data.snippet,
        label_ids: detail.data.labelIds,
      });
    }
    nextPageToken = res.data.nextPageToken ?? undefined;
  } while (nextPageToken);

  writeFileSync("data/gmail.jsonl", records.map(r => JSON.stringify(r)).join("\n"));
  console.log(`Exported ${records.length} messages`);
}

exportGmail().catch(console.error);
```

### Running the Exports

```bash
# Install Google APIs client
npm install googleapis

# Set credentials
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REFRESH_TOKEN="your-refresh-token"

# Run exports
npx tsx scripts/export-google-photos.ts
npx tsx scripts/export-google-drive.ts
npx tsx scripts/export-gmail.ts
```

## Step 3: Create Coral Source Specs

### Google Photos Spec (`coral/sources/community/google_photos/manifest.yaml`)

```yaml
name: google_photos
version: 0.1.0
dsl_version: 3
backend: jsonl
description: Google Photos media library — photos, screenshots, and albums
inputs:
  DATA_PATH:
    kind: variable
    default: /path/to/your/data
    hint: Path containing the google_photos.jsonl file
test_queries:
  - SELECT filename, mime_type, creation_time FROM google_photos.photos LIMIT 3
  - SELECT COUNT(*) AS photo_count FROM google_photos.photos
tables:
  - name: photos
    description: Photo and video media items
    source:
      location: "file:///path/to/your/data/"
      glob: "google_photos.jsonl"
    columns:
      - name: id
        type: Utf8
        description: Google Photos media item ID
      - name: filename
        type: Utf8
        description: Original filename
      - name: mime_type
        type: Utf8
        description: MIME type (image/jpeg, video/mp4, etc.)
      - name: description
        type: Utf8
        description: User-provided description
      - name: media_url
        type: Utf8
        description: Base URL for media download
      - name: creation_time
        type: Utf8
        description: Media creation timestamp
      - name: width
        type: Int64
        nullable: true
        description: Image width in pixels
      - name: height
        type: Int64
        nullable: true
        description: Image height in pixels
```

### Google Drive Spec (`coral/sources/community/google_drive/manifest.yaml`)

Same structure — set `name: google_drive`, table `files`, glob `google_drive.jsonl`. Columns: `id`, `name`, `mime_type`, `size_bytes`, `created_time`, `modified_time`, `owner`.

### Gmail Spec (`coral/sources/community/gmail/manifest.yaml`)

Same structure — set `name: gmail`, table `messages`, glob `gmail.jsonl`. Columns: `id`, `thread_id`, `subject`, `from`, `date`, `snippet`, `label_ids`.

## Step 4: Register with Coral

```bash
coral source add --file coral/sources/community/google_photos/manifest.yaml
coral source add --file coral/sources/community/google_drive/manifest.yaml
coral source add --file coral/sources/community/gmail/manifest.yaml
```

## Step 5: Test and Query

```bash
coral source test google_photos
coral source test google_drive
coral source test gmail

coral sql --format json "SELECT filename, creation_time FROM google_photos.photos LIMIT 5"
coral sql --format json "SELECT name, mime_type FROM google_drive.files WHERE mime_type LIKE 'image/%' LIMIT 10"
coral sql --format json "SELECT subject, date FROM gmail.messages WHERE subject LIKE '%prescription%' LIMIT 5"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `credential` block oneOf validation error (Coral v0.2.0) | Community specs with OAuth `credential` blocks may fail schema validation. Use the minimal manifest structure shown above — omit `credential`, `authentication`, and `format` properties. |
| `backend: file` not supported | Change to `backend: jsonl`. Coral v0.2.0 only supports `jsonl` and `csv` backends. |
| `coral source add --file` not resolving templates | Hardcode absolute paths in the `source.location` field instead of using `{{input.DATA_PATH}}`. |
| Quota limits on Google APIs | The free tier allows 10,000 requests/day for Photos, 1B queries/day quota for Drive, and 250M queries/day for Gmail. Export scripts respect these limits. |
| OAuth tokens expiring | Use a refresh token flow. The initial authorization grants a refresh token (does not expire unless revoked). Store it securely and use it to generate access tokens on each export run. |

## Benefits for CareOps

Adding Google source specs enables:

- **Google Photos**: Search care-related photos (prescriptions, wound images, diet photos) across the media library
- **Google Drive**: Find medical PDFs (lab reports, discharge summaries, insurance documents) stored in Drive
- **Gmail**: Search for appointment confirmations, prescription refill emails, and doctor correspondence

These specs join naturally with CareOps data via date ranges and patient identifiers, enriching the doctor visit packet with original source documents.
