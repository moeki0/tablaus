import Link from "next/link";
import { SignInOutButton } from "@/components/auth/SignInOutButton";
import { extractBody, extractColumns, parseCsv } from "@/components/csvTable";
import { tables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db, pool } from "@/lib/db";
import { ensureSchema } from "@/lib/ensureSchema";
import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { FiEdit } from "react-icons/fi";

type TableListItem = {
  id: string;
  title: string;
  rowCount: number;
  columnCount: number;
  createdAt: string;
  updatedAt: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "yyyy/MM/dd HH:mm");
};

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
      </main>
    );
  }

  const userId = session.user.email;
  const records = await db
    .select({
      id: tables.id,
      name: tables.name,
      csv: tables.csv,
      createdAt: tables.createdAt,
      updatedAt: tables.updatedAt,
    })
    .from(tables)
    .where(eq(tables.userId, userId))
    .orderBy(desc(tables.updatedAt), desc(tables.createdAt));

  const tableList: TableListItem[] = records.map((table) => {
    const parsed = parseCsv(table.csv);
    const columns = extractColumns(parsed);
    const body = extractBody(parsed);

    return {
      id: table.id,
      title: table.name || "Untitled",
      rowCount: body.length,
      columnCount: columns.length,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  });

  return (
    <main className="h-screen overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-2 py-1 border-b border-gray-200 shadow bg-white">
        <div className="flex items-center gap-3">
          <h1 className="font-bold">Tablaus</h1>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/tables/new"
            className="inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-1 text-white shadow hover:bg-gray-800 transition"
          >
            New <FiEdit />
          </Link>
          <SignInOutButton />
        </div>
      </div>

      <div className="bg-gray-50 flex w-screen h-[calc(100vh-40px)] overflow-scroll max-w-full">
        <div className="w-screen bg-gray-50 rounded h-full overflow-scroll">
          <table className="min-w-full">
            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
              <tr>
                {["Title", "Rows", "Columns", "Created At", "Updated At"].map(
                  (label) => (
                    <th
                      key={label}
                      className="text-left font-semibold text-gray-800"
                    >
                      <p className="px-2 py-1 border-b border-gray-200">{label}</p>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {tableList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    まだテーブルがありません。「新しいテーブル」を押して作成してください。
                  </td>
                </tr>
              ) : (
                tableList.map((table) => (
                  <tr
                    key={table.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className=" text-gray-800">
                      <Link
                        href={`/tables/${table.id}`}
                        className="px-2 py-1 block truncate"
                      >
                        {table.title}
                      </Link>
                    </td>
                    <td className="tabular-nums text-gray-600">
                      <Link
                        href={`/tables/${table.id}`}
                        className="px-2 py-1 block truncate"
                      >
                        {table.rowCount}
                      </Link>
                    </td>
                    <td className="tabular-nums text-gray-600">
                      <Link
                        href={`/tables/${table.id}`}
                        className="px-2 py-1 block truncate"
                      >
                        {table.columnCount}
                      </Link>
                    </td>
                    <td className="text-gray-600">
                      <Link
                        href={`/tables/${table.id}`}
                        className="px-2 py-1 block truncate"
                      >
                        {formatDate(table.createdAt)}
                      </Link>
                    </td>
                    <td className=" text-gray-600">
                      <Link
                        href={`/tables/${table.id}`}
                        className="px-2 py-1 block truncate"
                      >
                        {formatDate(table.updatedAt)}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="sticky border-b border-gray-200 bottom-0 bg-gray-100">
              <tr>
                <td className=" font-semibold text-gray-700">
                  <p className="px-2 py-1 border-t border-gray-200">
                    Count: {tableList.length}
                  </p>
                </td>
                <td>
                  <p className="px-2 py-1 border-t border-gray-200 absolute top-0 left-0 right-0 bottom-0"></p>
                </td>
                <td>
                  <p className="px-2 py-1 border-t border-gray-200 absolute top-0 left-0 right-0 bottom-0"></p>
                </td>
                <td>
                  <p className="px-2 py-1 border-t border-gray-200 absolute top-0 left-0 right-0 bottom-0"></p>
                </td>
                <td>
                  <p className="px-2 py-1 border-t border-gray-200 absolute top-0 left-0 right-0 bottom-0"></p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </main>
  );
}
