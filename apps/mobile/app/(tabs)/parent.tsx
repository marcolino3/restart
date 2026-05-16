import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ParentTab() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        <Text className="text-2xl font-bold text-foreground">My children</Text>
        <Text className="mt-2 text-muted-foreground">
          Stundenplan + messages — coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
