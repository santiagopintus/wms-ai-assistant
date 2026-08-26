/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/src/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
        },
      },
    ],
  },
  // Source files use NodeNext-style relative imports with explicit ".js"
  // extensions (e.g. "../lib/db.js") even though the files are ".ts" — this
  // maps those back to the real files so ts-jest (running in CommonJS mode
  // for tests) can resolve them.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
