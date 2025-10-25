import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('NavigationRef not ready, cannot navigate to', name);
  }
}
 
export default {
  navigationRef,
  navigate,
};
