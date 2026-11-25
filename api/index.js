// Vercel serverless entrypoint. The Express app is shared with local `npm start`.
//
// IMPORTANT: the default local database is SQLite on disk and published sites are
// written to the filesystem. Vercel functions have an ephemeral, read-only
// filesystem, so a real deployment must provide external persistent storage.
// See docs/VERCEL.md before deploying.
import app from "../server/index.js";

export default function handler(req, res) {
  return app(req, res);
}
