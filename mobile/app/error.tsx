import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ErrorScreen({ error, retry }: { error: Error; retry: () => void }) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-paper px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-danger/10">
        <Ionicons name="alert-circle" size={40} color="#DC2626" />
      </View>
      <Text className="mt-6 text-[22px] font-bold text-ink">Something went wrong</Text>
      <Text className="mt-2 text-center text-[14px] text-soft">
        {error.message || "An unexpected error occurred"}
      </Text>
      <View className="mt-8 flex-row gap-3">
        <TouchableOpacity
          onPress={retry}
          className="rounded-xl bg-brand px-6 py-3"
        >
          <Text className="text-[14px] font-bold text-white">Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="rounded-xl border border-line px-6 py-3"
        >
          <Text className="text-[14px] font-bold text-ink">Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
