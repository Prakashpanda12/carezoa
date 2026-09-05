import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-paper px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-brand/10">
        <Ionicons name="search" size={40} color="#0E7C7B" />
      </View>
      <Text className="mt-6 text-[22px] font-bold text-ink">Page Not Found</Text>
      <Text className="mt-2 text-center text-[14px] text-soft">
        The page you're looking for doesn't exist.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/")}
        className="mt-8 rounded-xl bg-brand px-6 py-3"
      >
        <Text className="text-[14px] font-bold text-white">Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}
