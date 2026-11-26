import { useCallback, useEffect, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { makeMutable } from 'react-native-reanimated';

/** 1 while the floating tab bar is hidden, 0 while it is visible. Read by AppTabs. */
export const tabBarHidden = makeMutable(0);

export function setTabBarHidden(hidden: boolean) {
  const next = hidden ? 1 : 0;
  if (tabBarHidden.value !== next) tabBarHidden.value = next;
}

/** Scroll distance (px) in one direction before the tab bar reacts, to ignore jitter. */
const THRESHOLD = 10;
/** Never hide the bar this close to the top of a screen. */
const TOP_ZONE = 60;

/**
 * Pass the returned handler to a vertical ScrollView / FlatList `onScroll`
 * (with `scrollEventThrottle`). Scrolling down hides the tab bar, scrolling up shows it.
 */
export function useTabBarScroll() {
  const lastY = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const maxY = Math.max(0, contentSize.height - layoutMeasurement.height);

    // Ignore iOS rubber-banding past either edge
    if (y < 0 || y > maxY) {
      lastY.current = Math.min(Math.max(y, 0), maxY);
      return;
    }
    if (y <= TOP_ZONE) {
      setTabBarHidden(false);
    } else if (y - lastY.current > THRESHOLD) {
      setTabBarHidden(true);
    } else if (lastY.current - y > THRESHOLD) {
      setTabBarHidden(false);
    } else {
      return; // below threshold: keep the reference point so slow scrolls still register
    }
    lastY.current = y;
  }, []);

  // Leaving the screen always brings the tab bar back
  useEffect(() => () => setTabBarHidden(false), []);

  return onScroll;
}
