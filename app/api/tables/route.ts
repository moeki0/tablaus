import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tables } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { initialCsv } from "@/components/csvTable";
import { ensureSchema } from "@/lib/ensureSchema";
import { pool } from "@/lib/db";

export async function GET() {
  await ensureSchema(pool);
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await db
    .select()
    .from(tables)
    .where(eq(tables.userId, session.user.email))
    .orderBy(desc(tables.updatedAt));
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  await ensureSchema(pool);
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim()
    ? body.name.trim()
    : "Untitled";

  const [inserted] = await db
    .insert(tables)
    .values({
      name,
      csv: initialCsv,
      userId: session.user.email,
      querySpec: "",
    })
    .returning();

  return NextResponse.json(inserted, { status: 201 });
}
