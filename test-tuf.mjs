async function run() {
  const r = await fetch('https://takeuforward.org/profile/ayushman7');
  const html = await r.text();
  const m = html.match(/total_solved\\?":(\d+)/);
  console.log('TUF Total:', m ? m[1] : 'not found');
}
run();
