// frontend/config/googleConfig.js
// Replace the placeholder client IDs with your real Google OAuth client IDs
// Create OAuth client IDs in Google Cloud Console for iOS, Android and Web.
// For Expo (development) you may use the 'web' client id or configure redirect URIs.

const googleConfig = {
  // Android client ID (set for standalone or testing on Android)
  // These values come from your Firebase / Google Cloud OAuth clients.
  // For this project the web client ID (and often the expo client id) is:
  EXPO_CLIENT_ID: "644341783297-mmk33bodi7ecphvmakp076o4bgon4vk3.apps.googleusercontent.com",
  // Also set a WEB_CLIENT_ID (useful for some web flows)
  WEB_CLIENT_ID: "644341783297-mmk33bodi7ecphvmakp076o4bgon4vk3.apps.googleusercontent.com",
  // If you have platform-specific client IDs, set them here. You can fall back
  // to the web client id for development if the platform-specific ones are not set.
  ANDROID_CLIENT_ID: "462500880660-dqoct38iqejfqclqmu4aoru3q6gv3mi4.apps.googleusercontent.com",
  IOS_CLIENT_ID: "462500880660-dqoct38iqejfqclqmu4aoru3q6gv3mi4.apps.googleusercontent.com",
};

export default googleConfig;
