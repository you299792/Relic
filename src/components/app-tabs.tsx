import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
} from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { Folder, House, Menu, Search, LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { setTabBarHidden, tabBarHidden } from '../hooks/use-tab-bar-scroll';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/** Bar height + bottom offset + shadow, so it fully clears the screen edge. */
const TAB_BAR_HIDE_DISTANCE = 130;

function TabButton({ isActive, icon: Icon, label }: { isActive: boolean, icon: LucideIcon, label: string }) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    // Smooth, simple timing animation instead of a bouncy spring
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.quad), // Smooth deceleration
    });
  }, [isActive, progress]);

  // Very subtle background animation
  const bgStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.96 + progress.value * 0.04 }], // Scales gently from 96% to 100%
  }));

  return (
    <View style={styles.tabItem}>
      {/* The Animated Squircle Background */}
      <Animated.View pointerEvents="none" style={[styles.activePill, bgStyle]} />
      
      {/* The Content (Icon + Text) */}
      <View style={styles.contentContainer}>
        <Icon 
          fill={isActive ? '#FFFFFF' : 'transparent'}
          color={isActive ? '#FFFFFF' : '#94A3B8'} 
          size={22} 
          strokeWidth={isActive ? 1.5 : 2} 
        />
        <Text 
          style={[
            styles.label, 
            { color: isActive ? '#FFFFFF' : '#64748B' },
            isActive && { fontWeight: '700' }
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function AppTabs() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const isTabBarHidden = pathname.startsWith('/item') || pathname.startsWith('/(auth)');

  // Slide the bar off-screen while a screen is scrolled down; always show it on navigation
  useEffect(() => {
    setTabBarHidden(false);
  }, [pathname]);

  // expo-router's <TabList asChild> rejects style arrays, so the static bar styles are
  // merged into the animated style, which makes a single object.
  const tabBarStyle = StyleSheet.flatten([
    styles.tabBar,
    isTabBarHidden ? { display: 'none' } : undefined,
  ]);

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    ...tabBarStyle,
    transform: [
      {
        translateY: withTiming(tabBarHidden.value * TAB_BAR_HIDE_DISTANCE, {
          duration: 220,
          easing: Easing.out(Easing.quad),
        }),
      },
    ],
  }));

  return (
    <Tabs>
      <TabSlot style={styles.content} />
      <TabList asChild>
        <Animated.View style={animatedTabBarStyle}>
          <TabTrigger name="home" href="/" style={styles.tabTrigger}>
            <TabButton isActive={isActive('/')} icon={House} label="Home" />
          </TabTrigger>
          
          <TabTrigger name="search" href="/search" style={styles.tabTrigger}>
            <TabButton isActive={isActive('/search')} icon={Search} label="Search" />
          </TabTrigger>
          
          <TabTrigger name="collections" href="/collections" style={styles.tabTrigger}>
            <TabButton isActive={isActive('/collections')} icon={Folder} label="Folders" />
          </TabTrigger>
          
          <TabTrigger name="menu" href="/menu" style={styles.tabTrigger}>
            <TabButton isActive={isActive('/menu')} icon={Menu} label="Menu" />
          </TabTrigger>

          <TabTrigger name="item" href="/item/create" style={styles.hiddenTrigger} />
          <TabTrigger name="collection" href="/collection/[id]" style={styles.hiddenTrigger} />
        </Animated.View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  hiddenTrigger: {
    display: 'none',
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center', 
    width: '92%',
    maxWidth: 400,
    height: 76,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  tabTrigger: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItem: {
    width: 72,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18, // The squircle shape from Number 4
    backgroundColor: '#4F46E5',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, 
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
});