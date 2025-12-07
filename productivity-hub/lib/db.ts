import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);

// Helper function to execute SQL queries with parameters
async function executeQuery(query: string, params: any[] = []) {
  // Neon requires using sql.query() for parameterized queries
  // @ts-ignore - TypeScript types may not include query method
  return await sql.query(query, params);
}

/**
 * Supabase-compatible database wrapper for Neon
 */
class QueryBuilder {
  private whereClause: string = "";
  private whereParams: any[] = [];
  private orderClause: string = "";
  private limitClause: string = "";

  constructor(private table: string, private columns: string = "*") {}

  select(columns = "*") {
    return new QueryBuilder(this.table, columns);
  }

  eq(column: string, value: any) {
    this.whereClause = `WHERE ${column} = $${this.whereParams.length + 1}`;
    this.whereParams.push(value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending ? "ASC" : "DESC";
    this.orderClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number) {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  async single() {
    try {
      const query = `SELECT ${this.columns} FROM ${this.table} ${this.whereClause} ${this.orderClause} LIMIT 1`.trim().replace(/\s+/g, ' ');
      const result = await executeQuery(query, this.whereParams);
      return { data: result[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const promise = (async () => {
      try {
        const query = `SELECT ${this.columns} FROM ${this.table} ${this.whereClause} ${this.orderClause} ${this.limitClause}`.trim().replace(/\s+/g, ' ');
        const result = await executeQuery(query, this.whereParams);
        return { data: result, error: null };
      } catch (error) {
        return { data: null, error };
      }
    })();

    return promise.then(onfulfilled, onrejected);
  }

  insert(data: any) {
    // Handle arrays of data
    if (Array.isArray(data)) {
      data = data[0]; // Take first element if array
    }

    const keys = Object.keys(data);
    const values = Object.values(data);

    // Use numbered placeholders but ensure they're properly formatted
    const placeholders = keys.map((_, i) => `\$${i + 1}`).join(", ");
    const table = this.table;

    return {
      select: () => ({
        single: async () => {
          try {
            const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
            console.log('INSERT Query:', query);
            console.log('INSERT Values:', values);
            const result = await executeQuery(query, values);
            return { data: result[0], error: null };
          } catch (error) {
            console.error('INSERT Error:', error);
            return { data: null, error };
          }
        },
      }),
      then: <TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
      ): Promise<TResult1 | TResult2> => {
        const promise = (async () => {
          try {
            const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
            console.log('INSERT Query:', query);
            console.log('INSERT Values:', values);
            const result = await executeQuery(query, values);
            return { data: result, error: null };
          } catch (error) {
            console.error('INSERT Error:', error);
            return { data: null, error };
          }
        })();

        return promise.then(onfulfilled, onrejected);
      },
    };
  }

  update(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    return {
      eq: async (column: string, value: any) => {
        try {
          const query = `UPDATE ${this.table} SET ${sets} WHERE ${column} = $${keys.length + 1}`;
          await executeQuery(query, [...values, value]);
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
    };
  }

  delete() {
    return {
      eq: async (column: string, value: any) => {
        try {
          const query = `DELETE FROM ${this.table} WHERE ${column} = $1`;
          await executeQuery(query, [value]);
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
