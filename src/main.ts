import { main } from 'app/index.js';

const config = {
  scale: 300 / 72,
  waitTimeForOcr: 10_000,
  workspace: './workspace',
  profile: 'mrsekut-merry-firends/mrsekut', // Profileページ
} as const;

main(config);
