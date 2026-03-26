# Project Rules

## Stack
- Node.js with Express
- JSON file persistence for local development

## Folder Conventions
- `src/`: server code
- `data/`: local persisted data

## Coding Rules
- Keep the API contract compatible with `maumlog-frontend`.
- Prefer simple, explicit route handlers over unnecessary abstractions.
- Store only local development data here; do not depend on sibling project internals at runtime.

## Verification
- Install dependencies with `npm install`
- Start the backend with `npm run dev`
- Verify the server responds on `http://localhost:8080/service1`
