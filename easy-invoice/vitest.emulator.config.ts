import { defineConfig } from "vitest/config";

// Separate config for the tests in tests/emulator/**, which talk to a real
// (local) Firestore + Auth emulator instead of jsdom. Run with:
//   firebase emulators:exec --only firestore,auth "npm run test:emulator:run"
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/emulator/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    // These files share one RulesTestEnvironment/emulator instance (see
    // tests/emulator/env.ts) and each clears all Firestore data in its
    // afterEach. Running files in parallel lets one file's clearFirestore()
    // wipe fixtures out from under another file's in-flight test, so file
    // execution must stay serial.
    fileParallelism: false,
  },
});
