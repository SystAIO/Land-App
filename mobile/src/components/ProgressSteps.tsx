import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { colors } from "../constants/theme";

const STEPS = ["Details", "Photos", "Location", "Review"];

export function ProgressSteps({ current }: { current: number }) {
  return (
    <View style={styles.wrap}>
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <React.Fragment key={label}>
            <View style={styles.step}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              >
                {done ? (
                  <Check size={11} color={colors.white} strokeWidth={3} />
                ) : (
                  <Text style={[styles.number, active && { color: colors.white }]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  (done || active) && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {index < STEPS.length - 1 ? (
              <View style={[styles.line, done && styles.lineDone]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    gap: 6,
  },
  step: {
    alignItems: "center",
    width: 54,
    gap: 4,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  number: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
  },
  label: {
    fontSize: 9.5,
    fontWeight: "600",
    color: colors.faint,
  },
  labelActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.lineSoft,
    borderRadius: 1,
    marginTop: 11,
  },
  lineDone: {
    backgroundColor: colors.success,
  },
});
