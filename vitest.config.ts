import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: playwright({
        launch: {
          headless: false,
        },
      }),
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
    testTimeout: 60000, // 60 seconds for video processing
  },
});
