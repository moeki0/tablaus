import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tables } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Table } from "@/components/table";
import Link from "next/link";
import { SignInOutButton } from "@/components/auth/SignInOutButton";
import { initialCsv } from "@/components/csvTable";
import { ensureSchema } from "@/lib/ensureSchema";
import { TableTitle } from "@/components/TableTitle";
import { pool } from "@/lib/db";
import Image from "next/image";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSchema(pool);
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/tables");
  }
  if (id === "new") {
    const [{ id }] = await db
      .insert(tables)
      .values({
        name: "Untitled",
        csv: initialCsv,
        userId: session.user.email,
      })
      .returning({ id: tables.id });
    redirect(`/tables/${id}`);
  }

  const [row] = await db.select().from(tables).where(eq(tables.id, id));
  if (!row || row.userId !== session.user.email) {
    notFound();
  }

  return (
    <main className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className=" text-gray-500">
            <Link href="/" className="">
              <Image width={28} height={28} alt="tablaus" src="/tablaus.png" />
            </Link>{" "}
          </div>
        </div>
        <SignInOutButton />
      </header>
      <div className="">
        <Table tableId={row.id} initialCsv={row.csv} initialName={row.name} />
      </div>
    </main>
  );
}
