import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetDate = searchParams.get('date');
  
  if (!targetDate) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const usersResult = await db.execute('SELECT * FROM users');
    const users = usersResult.rows as any[];
    
    const data = await Promise.all(users.map(async (user: any) => {
      // Snapshot on the target date
      const targetSnapshotResult = await db.execute({
        sql: 'SELECT * FROM progress_snapshots WHERE user_id = ? AND date = ?',
        args: [user.id, targetDate]
      });
      const targetSnapshot = targetSnapshotResult.rows[0] || null;
      
      // Snapshot immediately before the target date
      const previousSnapshotResult = await db.execute({
        sql: 'SELECT * FROM progress_snapshots WHERE user_id = ? AND date < ? ORDER BY date DESC LIMIT 1',
        args: [user.id, targetDate]
      });
      const previousSnapshot = previousSnapshotResult.rows[0] || null;
      
      let leetcodeSolved = 0;
      let tufSolved = 0;
      
      if (targetSnapshot) {
        const targetLc = Number(targetSnapshot.leetcode_easy || 0) + Number(targetSnapshot.leetcode_medium || 0) + Number(targetSnapshot.leetcode_hard || 0);
        const prevLc = previousSnapshot 
          ? (Number(previousSnapshot.leetcode_easy || 0) + Number(previousSnapshot.leetcode_medium || 0) + Number(previousSnapshot.leetcode_hard || 0))
          : Number(user.initial_lc_total || 0);
          
        leetcodeSolved = Math.max(0, targetLc - prevLc);
        
        const targetTuf = Number(targetSnapshot.tuf_total || 0);
        const prevTuf = previousSnapshot ? Number(previousSnapshot.tuf_total || 0) : Number(user.initial_tuf_total || 0);
        
        tufSolved = Math.max(0, targetTuf - prevTuf);
      }
      
      return {
        name: user.name,
        LeetCode: leetcodeSolved,
        TUF: tufSolved,
        hasData: !!targetSnapshot
      };
    }));
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
