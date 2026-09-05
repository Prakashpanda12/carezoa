import React, { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const cx = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

// ---------- atoms ----------

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  small = false,
  testID,
  accessibilityLabel,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  small?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand",
    secondary: "bg-ink",
    accent: "bg-accent",
    ghost: "bg-ink/5",
    danger: "bg-danger/10",
  };
  const textStyles: Record<string, string> = {
    primary: "text-white",
    secondary: "text-paper",
    accent: "text-white",
    ghost: "text-ink",
    danger: "text-danger",
  };
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      className={cx(
        "flex-row items-center justify-center rounded-full",
        small ? "px-4 py-2" : "px-6 py-3.5",
        styles[variant],
        (disabled || loading) && "opacity-50",
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" || variant === "danger" ? "#1B1F1E" : "#fff"} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={small ? 14 : 16}
              color={variant === "ghost" ? "#1B1F1E" : variant === "danger" ? "#D3402E" : "#F6F4EE"}
              style={{ marginRight: 6 }}
            />
          )}
          <Text className={cx("font-semibold", small ? "text-xs" : "text-[15px]", textStyles[variant])}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Field = React.forwardRef<TextInput, FieldProps>(
  ({ label, error, icon, ...input }, ref) => {
    return (
      <View className="mb-4">
        {label && (
          <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">
            {label}
          </Text>
        )}
        <View
          className={cx(
            "flex-row items-center rounded-2xl border bg-card px-4",
            error ? "border-danger" : "border-line",
          )}
        >
          {icon && <Ionicons name={icon} size={16} color="#9AA5A2" style={{ marginRight: 8 }} />}
          <TextInput
            ref={ref}
            placeholderTextColor="#9AA5A2"
            className="flex-1 py-3 text-[15px] text-ink"
            {...input}
          />
        </View>
        {error && <Text className="mt-1 text-[12px] font-medium text-danger">{error}</Text>}
      </View>
    );
  }
);

Field.displayName = "Field";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cx("rounded-xl3 border border-line bg-card p-4", className)}>{children}</View>
  );
}

export function Chip({
  label,
  icon,
  tone = "neutral",
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: "neutral" | "brand" | "success" | "warn" | "danger" | "dark";
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "rgba(27,31,30,0.06)", fg: "#5F6B68" },
    brand: { bg: "rgba(14,124,123,0.12)", fg: "#0E7C7B" },
    success: { bg: "rgba(31,157,108,0.14)", fg: "#1F9D6C" },
    warn: { bg: "rgba(201,138,27,0.15)", fg: "#C98A1B" },
    danger: { bg: "rgba(211,64,46,0.12)", fg: "#D3402E" },
    dark: { bg: "rgba(255,255,255,0.14)", fg: "rgba(246,244,238,0.92)" },
  };
  const t = tones[tone];
  return (
    <View
      className="flex-row items-center gap-1 self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: t.bg }}
    >
      {icon && <Ionicons name={icon} size={10} color={t.fg} />}
      <Text className="text-[10.5px] font-bold" style={{ color: t.fg }}>
        {label}
      </Text>
    </View>
  );
}

export function Avatar({
  name,
  size = 44,
  color = "#0E7C7B",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const text = name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: color + "1F" }}
    >
      <Text className="font-bold" style={{ color, fontSize: size * 0.34 }}>
        {text}
      </Text>
    </View>
  );
}

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? "star" : rating >= i - 0.5 ? "star-half" : "star-outline"}
          size={size}
          color="#C98A1B"
        />
      ))}
    </View>
  );
}

// ---------- layout ----------

export function Screen({
  children,
  onRefresh,
  refreshing,
  padded = true,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top + 4 }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName={cx("pb-36", padded && "px-5")}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#0E7C7B" />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View className="mb-4 mt-2 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center gap-3">
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-ink/5"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={18} color="#1B1F1E" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-[26px] font-bold tracking-tight text-ink" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && <Text className="text-[12.5px] text-soft">{subtitle}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-paper py-24">
      <ActivityIndicator size="large" color="#0E7C7B" />
      {label && <Text className="mt-3 text-[13px] text-soft">{label}</Text>}
    </View>
  );
}

export function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-paper px-8 py-24">
      <Ionicons name="cloud-offline-outline" size={36} color="#5F6B68" />
      <Text className="mt-3 text-center text-[14px] font-semibold text-ink">{label}</Text>
      <View className="mt-4">
        <Button title="Retry" onPress={onRetry} variant="ghost" small />
      </View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View className="items-center rounded-xl3 border border-dashed border-line bg-card px-6 py-10">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-ink/5">
        <Ionicons name={icon} size={22} color="#5F6B68" />
      </View>
      <Text className="mt-3 text-[15px] font-bold text-ink">{title}</Text>
      <Text className="mt-1 max-w-[240px] text-center text-[12.5px] leading-relaxed text-soft">
        {body}
      </Text>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row rounded-full bg-ink/5 p-1">
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          onPress={() => onChange(o.value)}
          className={cx(
            "flex-1 items-center rounded-full py-2",
            value === o.value && "bg-card shadow-sm",
          )}
        >
          <Text
            className={cx(
              "text-[13px] font-semibold",
              value === o.value ? "text-ink" : "text-faint",
            )}
          >
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SwitchRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!value)}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={label}
      className="flex-row items-center justify-between py-2.5"
    >
      <Text className="text-[14px] font-medium text-ink">{label}</Text>
      <View
        className={cx(
          "h-7 w-12 justify-center rounded-full px-0.5",
          value ? "items-end bg-brand" : "items-start bg-ink/15",
          disabled && "opacity-40",
        )}
      >
        <View className="h-6 w-6 rounded-full bg-white shadow" />
      </View>
    </TouchableOpacity>
  );
}

/**
 * BUG-M09 fix: Lightweight offline banner.
 * Uses AppState changes + periodic connectivity ping to detect offline state.
 * No external dependency needed — uses a simple HEAD request to the API.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkOnline = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch("https://httpbin.org/get", {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setOffline(false);
      } catch {
        setOffline(true);
      }
    };

    // Check on app focus
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") checkOnline();
    });

    // Initial check
    checkOnline();
    // Periodic check every 30s
    timerRef.current = setInterval(checkOnline, 30_000);

    return () => {
      subscription.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!offline) return null;

  return (
    <View
      className="flex-row items-center gap-2 bg-danger px-4 py-2"
      accessibilityRole="alert"
      accessibilityLabel="You appear to be offline. Some features may not work."
    >
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text className="flex-1 text-[12px] font-semibold text-white">
        You appear to be offline. Some features may not work.
      </Text>
    </View>
  );
}
