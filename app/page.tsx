import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tables } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SignInOutButton } from "@/components/auth/SignInOutButton";
import { ensureSchema } from "@/lib/ensureSchema";
import { pool } from "@/lib/db";
import Image from "next/image";

export default async function TablesPage() {
  await ensureSchema(pool);
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <main className="p-10 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tables</h1>
          <SignInOutButton />
        </header>
        <p>テーブルを見るにはログインしてください。</p>
      </main>
    );
  }

  const data = await db
    .select()
    .from(tables)
    .where(eq(tables.userId, session.user.email))
    .orderBy(desc(tables.createdAt));

  const createHref = "/tables/new";

  return (
    <main className="p-4 space-y-4 mx-auto">
      <header className="flex items-center justify-between">
        <div className=" text-gray-500 flex items-center gap-10">
          <Link href="/" className="">
            <Image width={28} height={28} alt="tablaus" src="/tablaus.png" />
          </Link>{" "}
        </div>
        <SignInOutButton />
      </header>
      <div className="space-y-3">
        <Link
          href={createHref}
          className="inline-flex items-center px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
        >
          新規作成
        </Link>
        <div className="">
          {data.length === 0 && (
            <div className="p-4 text-sm text-gray-500">
              まだテーブルがありません。
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            {data.map((t) => (
              <Link
                key={t.id}
                href={`/tables/${t.id}`}
                className="flex aspect-square overflow-hidden shadow rounded px-4 py-3 hover:bg-gray-50 bg-white"
              >
                <div>
                  <div className="font-semibold mb-1">{t.name}</div>
                  <pre className="text-xs w-full text-wrap break-all  text-gray-500">
                    {t.csv.replaceAll(/,/g, " ")}
                  </pre>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
