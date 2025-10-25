// utils/toastUtils.js
import Toast from "react-native-toast-message";

export const showSyncedToast = (message = "✅ Synced to Dashboard") => {
  Toast.show({
    type: "success",
    text1: message,
    visibilityTime: 2000,
    position: "top",
    topOffset: 60,
    textStyle: { fontSize: 16, fontWeight: "600" },
  });
};
