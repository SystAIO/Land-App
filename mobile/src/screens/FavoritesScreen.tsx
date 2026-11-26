import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Heart, Search } from "lucide-react-native";

import { EmptyState } from "../components/EmptyState";
import { PropertyCard } from "../components/PropertyCard";
import { ScreenTopBar } from "../components/Buttons";
import { colors, spacing } from "../constants/theme";
import { useListings } from "../context/ListingsContext";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Favorites">;

export function FavoritesScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { properties, favoriteIds, toggleFavorite, refreshing, refresh } = useListings();
  const saved = properties.filter((property) => favoriteIds.includes(property.id));
  const cardWidth = width - spacing.lg * 2;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenTopBar
        title="Saved properties"
        subtitle={`${saved.length} ${saved.length === 1 ? "property" : "properties"} in your shortlist`}
        onBack={() => navigation.goBack()}
        border={false}
        right={
          <Pressable
            onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
            style={styles.searchButton}
            accessibilityRole="button"
            accessibilityLabel="Browse properties"
          >
            <Search size={18} color={colors.ink} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(false)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {saved.length ? (
          <>
            <View style={styles.hint}>
              <Heart size={13} color={colors.primary} fill={colors.primary} />
              <Text style={styles.hintText}>
                Saved properties stay here. Tap the heart again to remove one.
              </Text>
            </View>
            <View style={styles.list}>
              {saved.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  width={cardWidth}
                  isFavorite
                  onToggleFavorite={() => toggleFavorite(property.id)}
                  onPress={() => navigation.navigate("PropertyDetail", { id: property.id })}
                />
              ))}
            </View>
          </>
        ) : (
          <EmptyState
            icon={<Heart size={30} color={colors.primary} strokeWidth={1.8} />}
            title="Nothing saved yet"
            body="Tap the heart on any property to keep it here and compare it with the others later."
            actionLabel="Browse properties"
            onAction={() => navigation.navigate("Tabs", { screen: "Home" })}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
    gap: spacing.md,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryTint,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    fontWeight: "500",
  },
  list: {
    gap: spacing.lg,
  },
});
