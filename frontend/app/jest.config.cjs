/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/src/__mocks__/styleMock.js",
    "^\\.\\./workers/createStreamTranscriptionWorker$": "<rootDir>/src/__mocks__/streamWorkerFactoryMock.js",
    "\\?worker$": "<rootDir>/src/__mocks__/workerMock.js",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.jest.json" }
    ]
  },
  cacheDirectory: "<rootDir>/.jest-cache",
};
