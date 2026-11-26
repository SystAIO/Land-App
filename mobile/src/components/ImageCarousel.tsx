import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ImageIcon } from "lucide-react-native";

import { colors } from "../constants/theme";

export function ImageCarousel({
  images,
  width,
  height,
  radius = 0,
  showDots = true,
  overlay,
  onPress,
  style,
}: {
  images: string[];
  width: number;
  height: number;
  radius?: number;
  showDots?: boolean;
  overlay?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fallbackWidth = Dimensions.get("window").width;
  const resolvedWidth = width || fallbackWidth;

  useEffect(() => {
    setIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [images.length]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / resolvedWidth);
    if (next !== index) setIndex(next);
  };

  if (!images.length) {
    return (
      <View
        style={[
          styles.empty,
          { width: resolvedWidth, height, borderRadius: radius },
          style,
        ]}
      >
        <ImageIcon size={30} color={colors.faint} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        { width: resolvedWidth, height, borderRadius: radius },
        style,
      ]}
    >
      {onPress ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={StyleSheet.absoluteFill}
        >
          {images.map((uri, position) => (
            <Image
              key={`${uri}-${position}`}
              source={{ uri }}
              style={{ width: resolvedWidth, height }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={StyleSheet.absoluteFill}
        >
          {images.map((uri, position) => (
            <Image
              key={`${uri}-${position}`}
              source={{ uri }}
              style={{ width: resolvedWidth, height }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {overlay ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {overlay}
        </View>
      ) : null}

      {showDots && images.length > 1 ? (
        <View pointerEvents="none" style={styles.dots}>
          {images.map((_, position) => (
            <View
              key={position}
              style={[
                styles.dot,
                position === index ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}

      {index >= 0 && images.length > 1 ? (
        <View pointerEvents="none" style={styles.counter}>
          <View style={styles.counterInner}>
            <ImageIcon size={10} color={colors.white} />
            <View style={{ width: 1 }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    backgroundColor: colors.canvasDeep,
  },
  empty: {
    backgroundColor: colors.canvasDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotActive: {
    width: 14,
    backgroundColor: colors.white,
  },
  counter: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 4,
    display: "none",
  },
  counterInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
