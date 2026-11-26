import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { colors } from "../constants/theme";

export function ImageViewer({
  visible,
  images,
  initialIndex = 0,
  title,
  onClose,
}: {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);

  React.useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [initialIndex, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.root}>
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {title ?? "Property photos"}
            </Text>
            <Text style={styles.counter}>
              {images.length ? index + 1 : 0} / {images.length}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close photos"
            style={styles.close}
          >
            <X size={21} color={colors.white} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(event) =>
            setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
          }
        >
          {images.map((uri, position) => (
            <View key={`${uri}-${position}`} style={{ width, height: height * 0.8 }}>
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
        <View style={[styles.dots, { paddingBottom: insets.bottom + 20 }]}>
          {images.map((_, position) => (
            <View
              key={position}
              style={[styles.dot, position === index && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  counter: {
    fontSize: 11.5,
    color: "#ABABAB",
    marginTop: 2,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4A4A4A",
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.white,
  },
});
