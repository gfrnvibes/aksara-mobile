import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export function AnimatedCard({
  children,
  index = 0,
  style,
  contentStyle,
  onPress,
}: {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!onPress) {
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 45, 360)).duration(320)}
        style={[animatedStyle, style]}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 45, 360)).duration(320)}
      style={[animatedStyle, style]}
    >
      <Pressable
        style={contentStyle}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 18, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 260 });
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
