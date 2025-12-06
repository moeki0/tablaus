import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tables = pgTable("tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  csv: text("csv").notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .defaultNow()
    .notNull(),
});

export type TableRow = typeof tables.$inferSelect;
export type NewTableRow = typeof tables.$inferInsert;
