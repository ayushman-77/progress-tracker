import { getTufStats } from './src/lib/tuf';

(async () => {
  const stats = await getTufStats('ayushman7');
  console.log('Stats:', stats);
})();
