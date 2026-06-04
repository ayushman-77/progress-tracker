import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLeetcodeStats } from '@/lib/leetcode';
import { getTufStats } from '@/lib/tuf';

export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM users');
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, leetcode_username, tuf_username } = await req.json();
    if (!name || !leetcode_username || !tuf_username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch initial baseline stats
    const leetcodeStats = await getLeetcodeStats(leetcode_username);
    const tufStats = await getTufStats(tuf_username);
    const leetcodeTotal = (leetcodeStats?.easy || 0) + (leetcodeStats?.medium || 0) + (leetcodeStats?.hard || 0);
    const tufTotal = tufStats?.total || 0;

    const result = await db.execute({
      sql: `
        INSERT INTO users (name, leetcode_username, tuf_username, initial_lc_total, initial_tuf_total)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [name, leetcode_username, tuf_username, leetcodeTotal, tufTotal]
    });
    
    // Also create the first snapshot
    const date = new Date().toISOString().split('T')[0];
    const userId = Number(result.lastInsertRowid);
    
    await db.execute({
      sql: `
        INSERT INTO progress_snapshots (
          user_id, date, 
          leetcode_easy, leetcode_medium, leetcode_hard, 
          tuf_total, tuf_easy, tuf_medium, tuf_hard
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        userId, date,
        leetcodeStats?.easy || 0, leetcodeStats?.medium || 0, leetcodeStats?.hard || 0,
        tufStats?.total || 0, tufStats?.easy || 0, tufStats?.medium || 0, tufStats?.hard || 0
      ]
    });

    return NextResponse.json({ success: true, id: userId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
