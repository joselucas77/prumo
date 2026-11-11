const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function getConnectionString() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/DIRECT_URL=["']?([^"'\r\n]+)["']?/);
    if (match) return match[1];
  }
  return process.env.DIRECT_URL;
}

async function run() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error("DIRECT_URL not found in .env.local");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  console.log("Connecting to Supabase PostgreSQL...");
  await client.connect();
  console.log("Connected successfully.");

  const sql = `
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TABLE IF NOT EXISTS public.tasks (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ,
      recurrence_type TEXT NOT NULL,
      recurrence_value TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'in_progress',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks (updated_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
    CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON public.tasks (order_index);

    DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
    CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow all operations for anon" ON public.tasks;
    CREATE POLICY "Allow all operations for anon" ON public.tasks
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  `;

  console.log("Executing DDL migration for tasks table...");
  await client.query(sql);
  console.log("Tasks table, indexes, updated_at trigger, and RLS policies created successfully!");

  await client.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
