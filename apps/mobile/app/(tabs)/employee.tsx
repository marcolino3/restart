import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmployeeTab() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        <Text className="text-2xl font-bold text-foreground">Time tracking</Text>
        <Text className="mt-2 text-muted-foreground">
          Stempeluhr — coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
