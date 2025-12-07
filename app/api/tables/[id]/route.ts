import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tables } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSchema } from "@/lib/ensureSchema";
import { pool } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema(pool);
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [row] = await db.select().from(tables).where(eq(tables.id, id));
  if (!row || row.userId !== session.user.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema(pool);
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const csv = typeof body.csv === "string" ? body.csv : null;
  const name = typeof body.name === "string" ? body.name : null;
  const querySpec =
    typeof body.querySpec === "string" ? body.querySpec : undefined;

  const [existing] = await db
    .select()
    .from(tables)
    .where(eq(tables.id, id));
  if (!existing) {
    const [inserted] = await db
      .insert(tables)
      .values({
        id,
        csv: csv ?? "",
        name: name ?? "Untitled",
        userId: session.user.email,
        querySpec: querySpec ?? "",
      })
      .returning();
    return NextResponse.json(inserted);
  }
  if (existing.userId !== session.user.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(tables)
    .set({
      csv: csv ?? existing.csv,
      name: name ?? existing.name,
      querySpec: querySpec ?? existing.querySpec,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tables.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSchema(pool);
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select()
    .from(tables)
    .where(eq(tables.id, id));
  if (!existing || existing.userId !== session.user.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(tables).where(eq(tables.id, id));
  return NextResponse.json({ success: true }, { status: 200 });
}
