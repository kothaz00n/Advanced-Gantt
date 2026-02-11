module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    "node_modules/(?!(powerbi-visuals-utils-formattingmodel|powerbi-visuals-utils-dataviewutils|powerbi-visuals-utils-chartutils|powerbi-visuals-utils-colorutils|powerbi-visuals-utils-tooltiputils|d3|d3-.*)/)"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/tests/__mocks__/styleMock.js"
  }
};
