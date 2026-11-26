import React, { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radii } from "../constants/theme";

export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  error?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(autoFocus);
  const digits = value.split("");
  const activeIndex = Math.min(value.length, length - 1);

  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, length);
    onChange(clean);
  };

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      style={styles.pressable}
    >
      <View style={styles.row}>
        {Array.from({ length }).map((_, index) => {
          const filled = Boolean(digits[index]);
          const isActive = focused && index === activeIndex;
          return (
            <View
              key={index}
              style={[
                styles.box,
                filled && styles.boxFilled,
                isActive && styles.boxActive,
                error && styles.boxError,
              ]}
            >
              <Text style={styles.digit}>{digits[index] ?? ""}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={length}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
        caretHidden
        accessibilityLabel="One-time password"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  box: {
    flex: 1,
    maxWidth: 54,
    height: 58,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: {
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
  },
  hiddenInput: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.01,
    color: "transparent",
  },
});
