import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Auto-create missing tables on cold start
const sql = client;
for (const [name, table] of Object.entries(schema)) {
  if (typeof table === "object" && "columns" in table) {
    const cols = Object.entries(table.columns as Record<string, any>)
      .map(([colName, col]: [string, any]) => {
        let colDef = `"${colName}" ${col.dataType === "number" || col.dataType === "real" ? "real" : col.dataType === "integer" ? "integer" : "text"}`;
        if (col.primary) colDef += " primary key";
        if (col.notNull) colDef += " not null";
        if (col.default !== undefined) colDef += ` default ${typeof col.default === "string" ? `'${col.default}'` : col.default}`;
        return colDef;
      })
      .join(", ");
    sql.execute(`create table if not exists "${(table as any).dbName}" (${cols})`).catch(() => {});
  }
}
