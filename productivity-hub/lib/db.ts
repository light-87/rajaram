import { neon } from "@neondatabase/serverless";

const neonSql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);

// Helper to execute queries (cast to bypass template string requirement)
const executeQuery = async (query: string, params: any[] = []) => {
  return (neonSql as any)(query, params) as Promise<any[]>;
};

// Helper function to execute SQL queries with parameters
async function executeQuery(query: string, params: any[] = []) {
  // Neon requires using sql.query() for parameterized queries
  // @ts-ignore - TypeScript types may not include query method
  return await sql.query(query, params);
}

/**
 * Supabase-compatible database wrapper for Neon
 */
class QueryBuilder<T = any> {
  private filters: string[] = [];
  private params: any[] = [];
  private orderClause = "";
  private limitClause = "";

  constructor(private table: string, private columns = "*") {}

  select(columns = "*") {
    return new QueryBuilder<T>(this.table, columns);
  }

  eq(column: string, value: any) {
    this.filters.push(`${column} = $${this.params.length + 1}`);
    this.params.push(value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending ? "ASC" : "DESC";
    this.orderClause = ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number) {
    this.limitClause = ` LIMIT ${count}`;
    return this;
  }

  private buildQuery() {
    let query = `SELECT ${this.columns} FROM ${this.table}`;
    if (this.filters.length > 0) {
      query += ` WHERE ${this.filters.join(" AND ")}`;
    }
    query += this.orderClause + this.limitClause;
    return query;
  }

  async single() {
    try {
      const query = this.buildQuery() + (this.limitClause ? "" : " LIMIT 1");
      const result = await executeQuery(query, this.params);
      return { data: (result[0] as T) || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  then<TResult1 = { data: T[] | null; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    const promise = (async () => {
      try {
        const query = this.buildQuery();
        const result = await executeQuery(query, this.params);
        return { data: result as T[], error: null };
      } catch (error) {
        return { data: null, error };
      }
    })();

    return promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): PromiseLike<{ data: T[] | null; error: any } | TResult> {
    return this.then(undefined, onrejected);
  }

  insert(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const insertObj = {
      select: () => ({
        single: async () => {
          try {
            const query = `INSERT INTO ${this.table} (${keys.join(
              ", "
            )}) VALUES (${placeholders}) RETURNING *`;
            const result = await executeQuery(query, values);
            return { data: result[0] as T, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
      }),
      then: <TResult1 = { data: null; error: any }, TResult2 = never>(
        onfulfilled?: ((value: { data: null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
      ): PromiseLike<TResult1 | TResult2> => {
        const promise = (async () => {
          try {
            const query = `INSERT INTO ${this.table} (${keys.join(
              ", "
            )}) VALUES (${placeholders}) RETURNING *`;
            await executeQuery(query, values);
            return { data: null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        })();

        return promise.then(onfulfilled, onrejected);
      },
    };

    return insertObj as any;
  }

  update(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    return {
      eq: async (column: string, value: any) => {
        try {
          const query = `UPDATE ${this.table} SET ${sets} WHERE ${column} = $${
            keys.length + 1
          }`;
          await executeQuery(query, [...values, value]);
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
    };
  }
}

export const supabase = {
  from: <T = any>(table: string) => new QueryBuilder<T>(table),
};

export { neonSql as sql };
