import { Redirect } from "expo-router";
import { useAuth } from "../src/store/auth";

export default function Index() {
  const token = useAuth((s) => s.token);
  return <Redirect href={token ? "/(tabs)/home" : "/(auth)/onboarding"} />;
}
