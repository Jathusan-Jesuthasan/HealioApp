//frontend/utils/googleSignIn.js
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import googleConfig from "../config/googleConfig";
import { Platform, Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: googleConfig.EXPO_CLIENT_ID,
    androidClientId: googleConfig.ANDROID_CLIENT_ID,
    iosClientId: googleConfig.IOS_CLIENT_ID,
    webClientId: googleConfig.WEB_CLIENT_ID,
    // Explicit redirect URI to ensure the value you register in Google Cloud matches
    redirectUri: makeRedirectUri({ useProxy: true }),
    scopes: ["openid", "profile", "email"],
  });

  const handleResponse = async () => {
    console.debug("useGoogleAuth.handleResponse - raw response:", response);
    try {
      // Compute common redirect URIs developers will need to register.
      const redirectProxy = makeRedirectUri({ useProxy: true });
      const redirectNoProxy = makeRedirectUri({ useProxy: false });
      console.log('--- Google AuthSession debug ---');
      console.log('EXPO_CLIENT_ID:', googleConfig.EXPO_CLIENT_ID);
      console.log('WEB_CLIENT_ID:', googleConfig.WEB_CLIENT_ID);
      console.log('ANDROID_CLIENT_ID:', googleConfig.ANDROID_CLIENT_ID);
      console.log('IOS_CLIENT_ID:', googleConfig.IOS_CLIENT_ID);
      console.log('AuthSession redirectUri (useProxy=true):', redirectProxy);
      console.log('AuthSession redirectUri (useProxy=false):', redirectNoProxy);

      // On web, copy the proxy redirect URI to clipboard for convenience
      if (Platform.OS === 'web') {
        const toCopy = redirectProxy || redirectNoProxy || '';
        try {
          if (toCopy && typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(toCopy);
            Alert.alert('Redirect URI copied', 'The redirect URI was copied to your clipboard. Add it to your Google Cloud OAuth client settings.');
          } else if (toCopy) {
            // Fallback to showing alert with the URI
            Alert.alert('Redirect URI', toCopy);
          }
        } catch (e) {
          console.warn('Could not copy redirect URI to clipboard:', e?.message || e);
          try { Alert.alert('Redirect URI', redirectProxy || redirectNoProxy || 'unavailable'); } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Could not compute redirectUri:', e?.message || e);
    }
    if (response?.type === "success") {
      const params = response.params || {};
      const id_token = params.id_token || params.idtoken || params.idToken || params.access_token;
      console.debug("useGoogleAuth.handleResponse - id_token detected:", !!id_token);
      if (!id_token) return null;
      try {
        const credential = GoogleAuthProvider.credential(id_token);
        const result = await signInWithCredential(auth, credential);
        console.debug("useGoogleAuth.handleResponse - firebase user:", result?.user?.email);
        return result.user;
      } catch (err) {
        console.warn("Firebase signInWithCredential failed:", err.message || err);
        return null;
      }
    }
    return null;
  };

  // Helper that triggers the interactive prompt and handles the immediate result
  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const params = result.params || {};
        const id_token = params.id_token || params.idtoken || params.idToken || params.access_token;
        console.debug('handleGoogleLogin - id_token present:', !!id_token);
        if (!id_token) return null;
        try {
          const credential = GoogleAuthProvider.credential(id_token);
          const res = await signInWithCredential(auth, credential);
          console.debug('handleGoogleLogin - firebase user:', res?.user?.email);
          return res.user;
        } catch (err) {
          console.warn('handleGoogleLogin - Firebase signInWithCredential failed:', err?.message || err);
          return null;
        }
      }
      return null;
    } catch (err) {
      console.warn('handleGoogleLogin - promptAsync failed:', err?.message || err);
      return null;
    }
  };

  return { request, response, promptAsync, handleResponse };
};
