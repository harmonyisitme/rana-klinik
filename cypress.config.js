const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:5501', // Uygulamanızın çalıştığı adres
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
