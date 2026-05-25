import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedResult = {
  table: string;
  count: number;
};

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local or export it before running npm run seed.`);
  }

  return value;
}

function daysFromNow(days: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function isoDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function eventWindow(days: number, hour: number, durationHours = 2) {
  const startsAt = daysFromNow(days, hour);
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);

  return {
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  };
}

async function seed() {
  loadLocalEnv();

  const supabase = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results: SeedResult[] = [];

  const funds = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Tithe",
      description: "Regular giving to support the ministry and operations of the church.",
      is_active: true,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      name: "Offering",
      description: "General one-off gifts and Sunday offerings.",
      is_active: true,
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      name: "Missions",
      description: "Giving toward local outreach and mission partnerships.",
      is_active: true,
    },
  ];

  const sermons = [
    {
      id: "20000000-0000-4000-8000-000000000001",
      title: "A People of Hope",
      speaker: "Pastor Grace Williams",
      series: "Foundations",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      preached_at: isoDate(7),
      notes_md: "A demo sermon exploring biblical hope and everyday faithfulness.",
      tags: ["hope", "discipleship"],
      is_published: true,
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      title: "Practising Generosity",
      speaker: "Pastor Daniel Ade",
      series: "Kingdom Habits",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      preached_at: isoDate(14),
      notes_md: "A demo sermon on generosity, stewardship, and trust.",
      tags: ["giving", "stewardship"],
      is_published: true,
    },
    {
      id: "20000000-0000-4000-8000-000000000003",
      title: "Prayer That Forms Us",
      speaker: "Pastor Grace Williams",
      series: "Kingdom Habits",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      preached_at: isoDate(21),
      notes_md: "A demo sermon about prayer as formation, not just requests.",
      tags: ["prayer", "formation"],
      is_published: true,
    },
    {
      id: "20000000-0000-4000-8000-000000000004",
      title: "Serving the City",
      speaker: "Elder Miriam Cole",
      series: "Sent Together",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      preached_at: isoDate(28),
      notes_md: "A demo sermon on mission, mercy, and public witness.",
      tags: ["mission", "service"],
      is_published: true,
    },
    {
      id: "20000000-0000-4000-8000-000000000005",
      title: "Rest for the Weary",
      speaker: "Pastor Daniel Ade",
      series: "Foundations",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      preached_at: isoDate(35),
      notes_md: "A demo sermon on Sabbath, rest, and receiving grace.",
      tags: ["rest", "grace"],
      is_published: true,
    },
  ];

  const events = [
    {
      id: "30000000-0000-4000-8000-000000000001",
      title: "Newcomers Lunch",
      description: "Meet the team, hear the church story, and ask practical next-step questions.",
      location: "Church Hall",
      ...eventWindow(10, 12, 2),
      capacity: 2,
      is_published: true,
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      title: "Midweek Prayer Night",
      description: "A simple evening of worship and prayer for the church and city.",
      location: "Main Auditorium",
      ...eventWindow(17, 19, 1.5),
      capacity: 80,
      is_published: true,
    },
    {
      id: "30000000-0000-4000-8000-000000000003",
      title: "Community Serve Day",
      description: "Teams serving local partners through practical projects across the community.",
      location: "Meet at Welcome Desk",
      ...eventWindow(24, 9, 4),
      capacity: 40,
      is_published: true,
    },
  ];

  for (const [table, rows] of [
    ["funds", funds],
    ["sermons", sermons],
    ["events", events],
  ] as const) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to seed ${table}: ${error.message}`);
    }

    results.push({ table, count: rows.length });
  }

  for (const result of results) {
    console.info(`Seeded ${result.count} ${result.table}.`);
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
