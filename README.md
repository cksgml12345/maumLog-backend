# maumlog-backend

Local backend for the `maumlog-frontend` project.

## Stack

- Node.js
- Express
- File-based JSON persistence

## Run

```bash
npm install
npm run dev
```

The API server starts on `http://localhost:8080`.

## Environment

- `PORT`: Optional. Defaults to `8080`.

## Notes

- Data is stored locally in `data/db.json`.
- This backend is designed to match the current frontend API contract for local development.
