import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);

/**
 * Supabase-compatible database wrapper for Neon
 */
class QueryBuilder {
  constructor(private table: string) {}

  select(columns = "*") {
    return {
      eq: async (column: string, value: any) => {
        try {
          const query = `SELECT ${columns} FROM ${this.table} WHERE ${column} = $1`;
          const result = await sql(query, [value]);
          return { data: result, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        const direction = options?.ascending ? "ASC" : "DESC";
        return {
          limit: async (count: number) => {
            try {
              const query = `SELECT ${columns} FROM ${this.table} ORDER BY ${column} ${direction} LIMIT $1`;
              const result = await sql(query, [count]);
              return { data: result, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          single: async () => {
            try {
              const query = `SELECT ${columns} FROM ${this.table} ORDER BY ${column} ${direction} LIMIT 1`;
              const result = await sql(query);
              return { data: result[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
        };
      },
      single: async () => {
        try {
          const query = `SELECT ${columns} FROM ${this.table} LIMIT 1`;
          const result = await sql(query);
          return { data: result[0] || null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    };
  }

  insert(data: any) {
    return {
      select: () => ({
        single: async () => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
          try {
            const query = `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
            const result = await sql(query, values);
            return { data: result[0], error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
      }),
    };
  }

  update(data: any) {
    return {
      eq: async (column: string, value: any) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
        try {
          const query = `UPDATE ${this.table} SET ${sets} WHERE ${column} = $${keys.length + 1}`;
          await sql(query, [...values, value]);
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
    };
  }
}

export const supabase = {
  from: (table: string) => new QueryBuilder(table),
};

export { sql };
