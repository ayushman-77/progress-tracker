import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/acSubmission`, {
      cache: 'no-store'
    });
    const data = await res.json();
    
    let solvedToday = 0;
    if (data && data.submission) {
      const now = new Date();
      // Start of today in local time (or UTC depending on preference, we'll use local date)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
      
      // Count unique problems solved today
      const solvedTitles = new Set();
      data.submission.forEach((sub: any) => {
        if (parseInt(sub.timestamp) >= todayStart) {
          solvedTitles.add(sub.titleSlug);
        }
      });
      solvedToday = solvedTitles.size;
    }
    
    return NextResponse.json({ solvedToday });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
