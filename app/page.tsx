import { SignInOutButton } from "@/components/auth/SignInOutButton";
import { tables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensureSchema";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";

export default async function HomePage() {
  await ensureSchema(pool);
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main className="p-10 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tables</h1>
          <SignInOutButton />
        </header>
        <p>テーブルにアクセスするにはログインしてください。</p>
      </main>
    );
  }

  const userId = session.user.email;
  const cookieStore = await cookies();
  const recentId = cookieStore.get("recentTableId")?.value ?? null;

  let targetId: string | null = null;

  if (recentId) {
    const [recent] = await db
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.id, recentId))
      .limit(1);
    if (recent) {
      targetId = recent.id;
    }
  }

  if (!targetId) {
    const [latest] = await db
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.userId, userId))
      .orderBy(desc(tables.updatedAt), desc(tables.createdAt))
      .limit(1);
    if (latest) {
      targetId = latest.id;
    }
  }

  if (targetId) {
    redirect(`/tables/${targetId}`);
  }

  redirect("/tables/new");
}
