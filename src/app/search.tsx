import { Search } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9] px-6" edges={['top']}>
      <View className="pt-8">
        <Search color="#6366F1" size={28} />
        <Text className="mt-4 text-2xl font-bold text-slate-900">Search</Text>
        <Text className="mt-2 text-sm text-slate-500">Find something in your archive.</Text>
      </View>
    </SafeAreaView>
  );
}
