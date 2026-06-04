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
    const users = db.prepare('SELECT * FROM users').all();
    
    const data = users.map((user: any) => {
      // Snapshot on the target date
      const targetSnapshot = db.prepare('SELECT * FROM progress_snapshots WHERE user_id = ? AND date = ?').get(user.id, targetDate) || null;
      
      // Snapshot immediately before the target date
      const previousSnapshot = db.prepare('SELECT * FROM progress_snapshots WHERE user_id = ? AND date < ? ORDER BY date DESC LIMIT 1').get(user.id, targetDate) || null;
      
      let leetcodeSolved = 0;
      let tufSolved = 0;
      
      if (targetSnapshot) {
        const targetLc = (targetSnapshot.leetcode_easy || 0) + (targetSnapshot.leetcode_medium || 0) + (targetSnapshot.leetcode_hard || 0);
        const prevLc = previousSnapshot 
          ? ((previousSnapshot.leetcode_easy || 0) + (previousSnapshot.leetcode_medium || 0) + (previousSnapshot.leetcode_hard || 0))
          : (user.initial_lc_total || 0);
          
        leetcodeSolved = Math.max(0, targetLc - prevLc);
        
        const targetTuf = targetSnapshot.tuf_total || 0;
        const prevTuf = previousSnapshot ? (previousSnapshot.tuf_total || 0) : (user.initial_tuf_total || 0);
        
        tufSolved = Math.max(0, targetTuf - prevTuf);
      }
      
      return {
        name: user.name,
        LeetCode: leetcodeSolved,
        TUF: tufSolved,
        hasData: !!targetSnapshot
      };
    });
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
