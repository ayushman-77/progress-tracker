import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLeetcodeStats } from '@/lib/leetcode';
import { getTufStats } from '@/lib/tuf';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const users = db.prepare('SELECT * FROM users').all() as any[];
    const date = new Date().toISOString().split('T')[0];
    
    const results = [];

    for (const user of users) {
      const leetcodeStats = await getLeetcodeStats(user.leetcode_username);
      const tufStats = await getTufStats(user.tuf_username);
      
      if (leetcodeStats || tufStats) {
        const stmt = db.prepare(`
          INSERT INTO progress_snapshots (
            user_id, date, 
            leetcode_easy, leetcode_medium, leetcode_hard, 
            tuf_total, tuf_easy, tuf_medium, tuf_hard
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, date) DO UPDATE SET
            leetcode_easy = excluded.leetcode_easy,
            leetcode_medium = excluded.leetcode_medium,
            leetcode_hard = excluded.leetcode_hard,
            tuf_total = excluded.tuf_total,
            tuf_easy = excluded.tuf_easy,
            tuf_medium = excluded.tuf_medium,
            tuf_hard = excluded.tuf_hard
        `);
        
        stmt.run(
          user.id, date,
          leetcodeStats?.easy || 0, leetcodeStats?.medium || 0, leetcodeStats?.hard || 0,
          tufStats?.total || 0, tufStats?.easy || 0, tufStats?.medium || 0, tufStats?.hard || 0
        );
        
        results.push({ user: user.name, status: 'synced', leetcodeStats, tufStats });
      } else {
        results.push({ user: user.name, status: 'failed' });
      }
    }
    
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    const date = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const data = users.map((user: any) => {
      const todayStats = db.prepare('SELECT * FROM progress_snapshots WHERE user_id = ? ORDER BY date DESC LIMIT 1').get(user.id) || null;
      
      // Let's get the most recent past stats before today
      const pastStats = db.prepare('SELECT * FROM progress_snapshots WHERE user_id = ? AND date < ? ORDER BY date DESC LIMIT 1').get(user.id, date) || null;
      
      return {
        ...user,
        today: todayStats,
        past: pastStats
      };
    });
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
