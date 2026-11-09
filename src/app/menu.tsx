import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon,
  Bell,
  Download,
  Upload,
  Trash2,
  Tag,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
  Database,
  HardDrive,
  Cloud,
  CloudOff
} from 'lucide-react-native';

export default function MenuScreen() {
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Shared shadow style
  const softShadow = {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  };

  // Reusable Menu Item Component
  const MenuItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    color = '#64748B', 
    showChevron = true, 
    rightElement = null,
    onPress = () => {}
  }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-4 px-5 border-b border-slate-100 last:border-b-0"
    >
      <View 
        className="p-2.5 rounded-xl mr-4"
        style={{ backgroundColor: `${color}15` }} // 15 is ~8% opacity
      >
        <Icon color={color} size={20} />
      </View>
      
      <View className="flex-1">
        <Text className="text-slate-800 font-semibold text-base">{title}</Text>
        {subtitle && (
          <Text className="text-slate-500 text-xs mt-0.5">{subtitle}</Text>
        )}
      </View>

      {rightElement ? rightElement : (
        showChevron && <ChevronRight color="#CBD5E1" size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9]" edges={['top']}>
      
      {/* --- HEADER --- */}
      <View className="px-5 pt-4 pb-4">
        <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Menu</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {/* --- USER PROFILE CARD --- */}
        <TouchableOpacity 
          className="bg-white p-5 rounded-[24px] flex-row items-center mb-6"
          style={softShadow}
          activeOpacity={0.8}
        >
          <View className="bg-indigo-100 p-1 rounded-full mr-4">
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} 
              className="w-16 h-16 rounded-full"
            />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 text-xl font-bold">Local User</Text>
            <Text className="text-slate-500 text-sm mt-0.5">Tap to manage profile</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>

        {/* --- SECTION 1: SYNC & STORAGE --- */}
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-2 mb-2">
          Sync & Storage
        </Text>
        <View className="bg-white rounded-[24px] mb-6 overflow-hidden" style={softShadow}>
          <MenuItem 
            icon={isSyncEnabled ? Cloud : CloudOff} 
            title="Cloud Sync" 
            subtitle={isSyncEnabled ? "Connected to Supabase" : "Working offline"}
            color="#10B981" // Emerald
            showChevron={false}
            rightElement={
              <Switch 
                value={isSyncEnabled} 
                onValueChange={setIsSyncEnabled}
                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                thumbColor="white"
              />
            }
          />
          <MenuItem 
            icon={Database} 
            title="Database Size" 
            subtitle="24.5 MB used"
            color="#6366F1" // Indigo
          />
          <MenuItem 
            icon={HardDrive} 
            title="Clear Cache" 
            subtitle="Free up local image storage"
            color="#F59E0B" // Amber
          />
        </View>

        {/* --- SECTION 2: APP PREFERENCES --- */}
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-2 mb-2">
          Preferences
        </Text>
        <View className="bg-white rounded-[24px] mb-6 overflow-hidden" style={softShadow}>
          <MenuItem 
            icon={Moon} 
            title="Dark Mode" 
            color="#8B5CF6" // Violet
            showChevron={false}
            rightElement={
              <Switch 
                value={isDarkMode} 
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#E2E8F0', true: '#8B5CF6' }}
                thumbColor="white"
              />
            }
          />
          <MenuItem 
            icon={Bell} 
            title="Notifications" 
            subtitle="Daily resurface reminders"
            color="#EC4899" // Pink
            showChevron={false}
            rightElement={
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: '#E2E8F0', true: '#EC4899' }}
                thumbColor="white"
              />
            }
          />
        </View>

        {/* --- SECTION 3: DATA MANAGEMENT --- */}
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-2 mb-2">
          Data Management
        </Text>
        <View className="bg-white rounded-[24px] mb-6 overflow-hidden" style={softShadow}>
          <MenuItem 
            icon={Download} 
            title="Export Backup" 
            subtitle="Save your archive to a JSON file"
            color="#3B82F6" // Blue
          />
          <MenuItem 
            icon={Upload} 
            title="Import Data" 
            subtitle="Restore from a previous backup"
            color="#3B82F6" // Blue
          />
          <MenuItem 
            icon={Tag} 
            title="Manage Tags" 
            subtitle="Rename or delete existing tags"
            color="#F59E0B" // Amber
          />
          <MenuItem 
            icon={Trash2} 
            title="Recently Deleted" 
            subtitle="Items are kept for 30 days"
            color="#EF4444" // Red
            // Removed the router.push here
          />
        </View>

        {/* --- SECTION 4: SUPPORT & ABOUT --- */}
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-2 mb-2">
          About
        </Text>
        <View className="bg-white rounded-[24px] mb-6 overflow-hidden" style={softShadow}>
          <MenuItem 
            icon={HelpCircle} 
            title="Help & Support" 
            color="#64748B" // Slate
          />
          <MenuItem 
            icon={Shield} 
            title="Privacy Policy" 
            color="#64748B" // Slate
          />
        </View>

        {/* --- LOGOUT BUTTON --- */}
        <TouchableOpacity 
          className="bg-white p-5 rounded-[24px] flex-row items-center justify-center mb-10"
          style={softShadow}
          activeOpacity={0.8}
        >
          <LogOut color="#EF4444" size={20} className="mr-2" />
          <Text className="text-red-500 font-bold text-base">Log Out</Text>
        </TouchableOpacity>

        {/* --- APP VERSION --- */}
        <Text className="text-center text-slate-400 text-xs font-medium mb-4">
          Relic v1.0.0 (Build 42)
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}