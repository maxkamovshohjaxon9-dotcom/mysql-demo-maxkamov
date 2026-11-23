import { getDb, describeDbError } from "../lib/db.mjs";

// Returns the most recently saved names for the list on the page.
export default async () => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(
      "SELECT name, created_at FROM names ORDER BY id DESC LIMIT 50"
    );
    return Response.json(rows);
  } catch (err) {
    console.error("api list failed:", err?.code, err?.message);
    return Response.json({ error: describeDbError(err) }, { status: 500 });
  }
};
