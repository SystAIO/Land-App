import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, radii, spacing } from "../constants/theme";

export function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: colors.primary }}> *</Text> : null}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function TextField({
  label,
  required,
  hint,
  error,
  prefix,
  containerStyle,
  multiline,
  ...props
}: TextInputProps & {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <FieldLabel label={label} required={required} hint={hint} /> : null}
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          focused && styles.inputWrapFocused,
          error ? styles.inputWrapError : null,
        ]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          {...props}
          multiline={multiline}
          placeholderTextColor={colors.faint}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            prefix ? styles.inputWithPrefix : null,
            props.style,
          ]}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.body,
  },
  hint: {
    fontSize: 11,
    color: colors.faint,
    fontWeight: "500",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  inputWrapMultiline: {
    minHeight: 112,
    alignItems: "flex-start",
    paddingTop: 13,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  inputWrapError: {
    borderColor: colors.danger,
  },
  prefix: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
    fontWeight: "500",
  },
  inputWithPrefix: {
    marginLeft: 0,
  },
  inputMultiline: {
    textAlignVertical: "top",
    paddingTop: 0,
    minHeight: 86,
  },
  error: {
    fontSize: 11.5,
    color: colors.danger,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineSoft,
    width: "100%",
  },
});
