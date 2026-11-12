import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
} from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { Folder, House, Menu, Search, LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type TabButtonProps = {
  isActive: boolean;
  icon: LucideIcon;
  label: string;
};

function TabButton({ isActive, icon: Icon, label }: TabButtonProps) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  }, [isActive]);

  // Animate the solid background squircle
  const bgStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  const activeColor = '#4F46E5'; // Indigo-600
  const inactiveColor = '#94A3B8'; // Slate-400
  const activeText = '#FFFFFF';
  const inactiveText = '#64748B';

  return (
    <View style={styles.tabContainer}>
      {/* Animated Solid Background Pill */}
      <Animated.View pointerEvents="none" style={[styles.activePill, bgStyle]} />
      
      {/* Icon & Label Stacked */}
      <View style={styles.contentContainer}>
        <Icon 
          fill={isActive ? activeText : 'transparent'}
          color={isActive ? activeText : inactiveColor} 
          size={22} 
          strokeWidth={isActive ? 1.5 : 2} 
        />
        <Text 
          style={[
            styles.label, 
            { color: isActive ? activeText : inactiveText },
            isActive && styles.labelActive
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

  const tabBarStyle = StyleSheet.flatten([
    styles.tabBar,
    isTabBarHidden ? { display: 'none' } : undefined,
  ]);

  return (
    <Tabs>
      <TabSlot style={styles.content} />
      <TabList asChild>
        <View style={tabBarStyle}>
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
        </View>
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
    left: '50%',
    transform: [{ translateX: '-50%' }],
    width: '92%',
    maxWidth: 420,
    height: 76, // Slightly taller to fit labels comfortably
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 72, // Fixed width for the tab pill
    height: 56, // Fixed height for the tab pill
  },
  activePill: {
    position: 'absolute',
    width: 72,
    height: 56,
    borderRadius: 18, // Squircle shape (Number 4)
    backgroundColor: '#4F46E5',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Ensure icon/text sit above the background
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: '700',
  }
});