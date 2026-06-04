export async function getLeetcodeStats(username: string) {
  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (data.errors) return null;
    return {
      easy: data.easySolved || 0,
      medium: data.mediumSolved || 0,
      hard: data.hardSolved || 0,
      total: data.solvedProblem || 0,
    };
  } catch (error) {
    console.error('Error fetching Leetcode stats:', error);
    return null;
  }
}
