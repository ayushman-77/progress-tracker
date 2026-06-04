import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLeetcodeStats } from '@/lib/leetcode';
import { getTufStats } from '@/lib/tuf';

export async function GET() {
  const users = db.prepare('SELECT * FROM users').all();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const { name, leetcode_username, tuf_username } = await req.json();
    if (!name || !leetcode_username || !tuf_username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch initial baseline stats
    const lcStats = await getLeetcodeStats(leetcode_username);
    const tufStats = await getTufStats(tuf_username);
    const initialLcTotal = lcStats ? lcStats.total : 0;
    const initialTufTotal = tufStats ? tufStats.total : 0;

    const stmt = db.prepare(`
      INSERT INTO users (name, leetcode_username, tuf_username, initial_lc_total, initial_tuf_total)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, leetcode_username, tuf_username, initialLcTotal, initialTufTotal);
    return NextResponse.json({ id: info.lastInsertRowid, name, leetcode_username, tuf_username, initialLcTotal, initialTufTotal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
