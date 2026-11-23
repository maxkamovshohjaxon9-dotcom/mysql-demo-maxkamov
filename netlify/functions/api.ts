import { desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { notes } from "../../db/schema.js";

const listNotes = () =>
  db
    .select({ name: notes.name, created_at: notes.createdAt })
    .from(notes)
    .orderBy(desc(notes.id))
    .limit(50);

export default async (req: Request) => {
  try {
    if (req.method === "POST") {
      let body: { name?: unknown } = {};
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
      }
      const clean = String(body.name ?? "").trim().slice(0, 100);
      if (!clean) {
        return Response.json({ error: "Ism kiritilmagan" }, { status: 400 });
      }
      await db.insert(notes).values({ name: clean });
      return Response.json(await listNotes(), { status: 201 });
    }

    if (req.method === "GET") {
      return Response.json(await listNotes());
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
};
