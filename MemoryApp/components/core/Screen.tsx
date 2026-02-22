import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  rightAction?: ReactNode;
  canGoBack?: boolean;
  fallbackRoute?: string;
  scroll?: boolean;
}>;

export function Screen({
  children,
  title,
  subtitle,
  rightAction,
  canGoBack = false,
  fallbackRoute,
  scroll = true,
}: ScreenProps) {
  const theme = useTheme();

  const goBack = () => {
    if (canGoBack) {
      router.back();
      return;
    }

    if (fallbackRoute) {
      router.replace(fallbackRoute as any);
    }
  };

  const body = (
    <View style={{ flex: 1, paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[4], gap: theme.spacing[3] }}>
      {title ? (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.radius.lg,
            padding: theme.spacing[4],
            gap: theme.spacing[2],
            ...theme.shadow.card,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
              {(canGoBack || fallbackRoute) ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={goBack}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: theme.radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.accentSoft,
                  }}
                >
                  <Ionicons name="chevron-back" size={theme.icon.lg} color={theme.colors.accent} />
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.title, color: theme.colors.text }}>{title}</Text>
                {subtitle ? <Text style={{ ...theme.typography.body, color: theme.colors.mutedText }}>{subtitle}</Text> : null}
              </View>
            </View>
            {rightAction}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 180,
          backgroundColor: theme.colors.gradientTop,
        }}
      />
      {scroll ? <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: theme.spacing[2] }}>{body}</ScrollView> : body}
    </SafeAreaView>
  );
}
