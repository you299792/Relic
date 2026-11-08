import { Folder } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CollectionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F4F6F9] px-6" edges={['top']}>
      <View className="pt-8">
        <Folder color="#6366F1" size={28} />
        <Text className="mt-4 text-2xl font-bold text-slate-900">Collections</Text>
        <Text className="mt-2 text-sm text-slate-500">Organize your saved items.</Text>
      </View>
    </SafeAreaView>
  );
}
