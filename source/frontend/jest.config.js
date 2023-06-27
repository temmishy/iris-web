module.exports = {
    preset: './app/static/assets/js/iris/tests/jest-preset.js',
    transform: {
      "^.+\\.(js|jsx)$": "babel-jest"
    }, 
    setupFilesAfterEnv: [
      './app/static/assets/js/iris/tests/jest.setup.js'
    ], 
    testEnvironment: 'jsdom'
  };