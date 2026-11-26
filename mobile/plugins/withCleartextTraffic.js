// Expo config plugin: allow http:// API calls on Android while the DuckDNS
// domain has no TLS certificate. Remove this plugin (and re-build) after
// switching EXPO_PUBLIC_API_BASE_URL to https://.
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (modConfig) => {
    const applications = modConfig.modResults.manifest.application;
    if (Array.isArray(applications) && applications.length > 0) {
      applications[0].$ = applications[0].$ || {};
      applications[0].$['android:usesCleartextTraffic'] = 'true';
    }
    return modConfig;
  });
};
