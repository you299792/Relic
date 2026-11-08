import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
} from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { Folder, House, Menu, Search } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export default function AppTabs() {
  const pathname = usePathname();

  return (
    <Tabs>
      <TabSlot style={styles.content} />
      <TabList asChild>
        <View style={styles.tabBar}>
          <TabTrigger name="home" href="/" style={styles.tabButton}>
            <House color={pathname === '/' ? '#4F46E5' : '#64748B'} size={21} />
            <Text style={[styles.label, pathname === '/' && styles.selectedLabel]}>Home</Text>
          </TabTrigger>
          <TabTrigger name="search" href="/search" style={styles.tabButton}>
            <Search color={pathname === '/search' ? '#4F46E5' : '#64748B'} size={21} />
            <Text style={[styles.label, pathname === '/search' && styles.selectedLabel]}>
              Search
            </Text>
          </TabTrigger>
          <TabTrigger name="collections" href="/collections" style={styles.tabButton}>
            <Folder color={pathname === '/collections' ? '#4F46E5' : '#64748B'} size={21} />
            <Text style={[styles.label, pathname === '/collections' && styles.selectedLabel]}>
              Collections
            </Text>
          </TabTrigger>
          <TabTrigger name="menu" href="/menu" style={styles.tabButton}>
            <Menu color={pathname === '/menu' ? '#4F46E5' : '#64748B'} size={21} />
            <Text style={[styles.label, pathname === '/menu' && styles.selectedLabel]}>Menu</Text>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  selectedLabel: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
