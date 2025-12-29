// Configuration for the Team URL Saver Extension

const CONFIG = {
  // REPLACE THIS with your deployed Web App URL
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbyGEmbqIXPa0KZD0aoxKi_ds6VRSid7811jbCy0hL9v-zi7ZfNITKUgZzeLUtrtD2Oz/exec",

  // REPLACE THIS with your chosen secret token (must match the one in Apps Script)
  SECRET_TOKEN: "PROPOSAL-123"
};

// Export for use in other files if using modules, but for simple popup.js inclusion we can just use global scope or ES modules.
// To keep it simple and compatible with standard popup.js loading:
if (typeof module !== 'undefined') {
  module.exports = CONFIG;
}
