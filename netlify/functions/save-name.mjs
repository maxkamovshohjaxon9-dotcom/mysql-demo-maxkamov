import { getDb, describeDbError } from "../lib/db.mjs";

const MAX_LENGTH = 255;

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Faqat POST so'rovi qabul qilinadi." },
      { status: 405, headers: { Allow: "POST" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "So'rov JSON formatida bo'lishi kerak." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "Ism kiritilmagan." }, { status: 400 });
  }
  if (name.length > MAX_LENGTH) {
    return Response.json(
      { error: `Ism ${MAX_LENGTH} belgidan oshmasligi kerak.` },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    // Prepared statement: the value is sent separately from the SQL text.
    const [result] = await db.execute("INSERT INTO names (name) VALUES (?)", [name]);
    return Response.json(
      { message: "Ism muvaffaqiyatli saqlandi!", id: result.insertId, name },
      { status: 201 }
    );
  } catch (err) {
    console.error("save-name failed:", err?.code, err?.message);
    return Response.json({ error: describeDbError(err) }, { status: 500 });
  }
};
