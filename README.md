# CSV Entity Push Action

A reusable GitHub Action that detects CSV row changes and pushes SCIM SET events, validates that all CSV rows have IDs, or generates missing row IDs.

## Modes

| Mode | Description |
|------|-------------|
| `push` | Detect row-level changes via git diff and POST JWT-encoded SCIM SET events |
| `validate` | Fail if any CSV row has an empty `id` value |
| `generate-ids` | Fill empty `id` fields with UUID v4 values |

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `mode` | yes | — | `push`, `validate`, or `generate-ids` |
| `csv-directory` | no | `csv_files` | Path to CSV directory (also configurable via `CSV_DIRECTORY` env var) |
| `entity-push-url` | push only | — | Endpoint URL for SCIM SET event POST |
| `entity-push-iss` | push only | — | JWT issuer claim |
| `entity-push-aud` | push only | — | JWT audience claim |
| `entity-push-token` | push only | — | HMAC signing secret and Bearer token |
| `before-sha` | no | `github.event.before` | Override base commit SHA for diff |

## Outputs

| Output | Mode | Description |
|--------|------|-------------|
| `events-sent` | push | Number of SCIM events successfully sent |
| `events-failed` | push | Number of SCIM events that failed |
| `ids-generated` | generate-ids | Number of IDs generated |
| `validation-errors` | validate | Number of rows with missing IDs |

## Usage

### Push mode

Detect CSV row changes on merge to `main` and send SCIM SET events:

```yaml
on:
  push:
    branches: [main]
    paths: ['csv_files/**/*.csv']

jobs:
  push-entities:
    runs-on: ubuntu-latest
    environment: sgnl client
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: SGNL-ai/csv-entity-push-action@v1
        with:
          mode: push
          csv-directory: csv_files
          entity-push-url: ${{ vars.ENTITY_PUSH_URL }}
          entity-push-iss: ${{ vars.ENTITY_PUSH_ISS }}
          entity-push-aud: ${{ vars.ENTITY_PUSH_AUD }}
          entity-push-token: ${{ secrets.ENTITY_PUSH_TOKEN }}
```

### Validate and generate IDs

Generate missing IDs and validate on pull request:

```yaml
on:
  pull_request:
    branches: [main]
    paths: ['csv_files/**/*.csv']

permissions:
  contents: write

jobs:
  validate-ids:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}

      - uses: SGNL-ai/csv-entity-push-action@v1
        id: gen
        with:
          mode: generate-ids
          csv-directory: csv_files

      - name: Commit generated IDs
        if: steps.gen.outputs.ids-generated > 0
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add csv_files/
          git commit -m "Auto-generate missing CSV row IDs"
          git push

      - uses: SGNL-ai/csv-entity-push-action@v1
        with:
          mode: validate
          csv-directory: csv_files
```

## CSV Conventions

- CSV files must have an `id` column containing a unique identifier per row
- Entity name is derived from the filename: strip `.csv`, take text after the last `-`, remove spaces
  - `SOR Name-Entity1.csv` → `Entity1`
- The `id` column is excluded from SCIM event data (it is already present in `sub_id`)

## SCIM SET Event Format

Events are JWT-encoded (HS256, `secevent+jwt` header type) and POSTed with `Content-Type: application/secevent+jwt`.

| Row change | Event type |
|------------|------------|
| New row | `urn:ietf:params:SCIM:event:prov:create:full` |
| Modified row | `urn:ietf:params:SCIM:event:prov:put:full` |
| Deleted row | `urn:ietf:params:SCIM:event:prov:delete` |

Payload (before JWT encoding):

```json
{
  "iss": "<configured issuer>",
  "iat": 1745524800,
  "jti": "<unique uuid>",
  "aud": "<configured audience>",
  "sub_id": {
    "format": "scim",
    "uri": "/<EntityName>/<id>",
    "externalId": "id",
    "id": "<row id>"
  },
  "events": {
    "<event_type>": {
      "data": {
        "schemas": ["urn:ietf:params:scim:schemas:core:2.0:<EntityName>"],
        "attribute1": "value1",
        "attribute2": "value2"
      }
    }
  }
}
```

## Development

```sh
npm install
npm test        # Run tests
npm run build   # Compile to dist/index.js
```

## License

MIT
