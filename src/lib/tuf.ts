import * as cheerio from 'cheerio';

export async function getTufStats(username: string) {
  try {
    const res = await fetch(`https://takeuforward.org/profile/${username}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    if (!res.ok) return null;
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let stats = null;
    
    // A very robust approach: extract numbers using specific keys, ignoring escape characters
    const totalMatch = html.match(/total_solved\\?":(\d+)/);
    const easyMatch = html.match(/easy\\?":\{.*?solved\\?":(\d+)/);
    const mediumMatch = html.match(/medium\\?":\{.*?solved\\?":(\d+)/);
    const hardMatch = html.match(/hard\\?":\{.*?solved\\?":(\d+)/);

    if (totalMatch || easyMatch || mediumMatch || hardMatch) {
      stats = {
        total: totalMatch ? parseInt(totalMatch[1], 10) : 0,
        easy: easyMatch ? parseInt(easyMatch[1], 10) : 0,
        medium: mediumMatch ? parseInt(mediumMatch[1], 10) : 0,
        hard: hardMatch ? parseInt(hardMatch[1], 10) : 0,
      };
    }
    
    return stats;
  } catch (error) {
    console.error('Error fetching TUF stats:', error);
    return null;
  }
}
