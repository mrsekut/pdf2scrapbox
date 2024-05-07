import { main } from 'app/index';

const config = {
  scale: 300 / 72,
  waitTimeForOcr: 10_000,
  dir: '.',
  profile: 'mrsekut-merry-firends/mrsekut', // Profileページ
} as const;

main(config);
