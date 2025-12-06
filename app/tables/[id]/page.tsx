import { initialCsv } from "@/components/csvTable";
import { tables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensureSchema";
import { pool } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { TableWorkspace } from "@/components/TableWorkspace";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSchema(pool);
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  if (id === "new") {
    const [{ id: newId }] = await db
      .insert(tables)
      .values({
        name: "Untitled",
        csv: initialCsv,
        userId: session.user.email,
      })
      .returning({ id: tables.id });
    redirect(`/tables/${newId}`);
  }

  const [row] = await db.select().from(tables).where(eq(tables.id, id));
  if (!row || row.userId !== session.user.email) {
    notFound();
  }

  const tableList = await db
    .select({
      id: tables.id,
      name: tables.name,
      createdAt: tables.createdAt,
    })
    .from(tables)
    .where(eq(tables.userId, session.user.email))
    .orderBy(desc(tables.updatedAt), desc(tables.createdAt));

  return (
    <main>
      <TableWorkspace
        tableList={tableList.map((t) => ({ id: t.id, name: t.name }))}
        activeId={row.id}
        tableId={row.id}
        initialCsv={row.csv}
        initialName={row.name}
      />
    </main>
  );
}
