import { MAP_PROVIDER } from "../constants/mapStyle";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Building,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  ImagePlus,
  IndianRupee,
  Info,
  LandPlot,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  Trash2,
  X,
} from "lucide-react-native";

import { BackButton, PrimaryButton } from "../components/Buttons";
import { EmptyState } from "../components/EmptyState";
import { FieldLabel, TextField } from "../components/Form";
import { LocationPicker, type PickedPlace } from "../components/LocationPicker";
import { PaymentModal } from "../components/PaymentModal";
import { Chip, StatusPill } from "../components/Pills";
import { ProgressSteps } from "../components/ProgressSteps";
import {
  AREA_UNITS,
  CITIES,
  LISTING_TYPES,
  PROPERTY_TYPES,
  areaUnitLabel,
  propertyTypeLabel,
} from "../constants/catalog";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useListings } from "../context/ListingsContext";
import { useToast } from "../context/ToastContext";
import type { RootStackParamList } from "../navigation/types";
import type {
  AreaUnit,
  LatLng,
  ListingType,
  NearbyLandmark,
  Property,
  PropertyImage,
  PropertyType,
} from "../types";
import {
  createProperty,
  resubmitProperty,
  updateProperty,
  type PropertyDraftInput,
} from "../services/api";
import { formatArea, formatPrice } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "ListProperty">;

type PropertyForm = {
  listingType: ListingType;
  propertyType: PropertyType;
  title: string;
  description: string;
  price: string;
  areaValue: string;
  areaUnit: AreaUnit;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  boundary: LatLng[];
  images: PropertyImage[];
  youtubeUrl: string;
  nearby: NearbyLandmark[];
};

type FormErrors = Partial<
  Record<
    | "title"
    | "description"
    | "price"
    | "area"
    | "youtube"
    | "images"
    | "location"
    | "address"
    | "locality"
    | "city"
    | "state"
    | "pincode",
    string
  >
>;

const STEP_TITLES = [
  "Start with the basics.",
  "Show every angle.",
  "Put it on the map.",
  "One last look.",
];

const STEP_SUBS = [
  "Buyers see the heading, price and area first. Keep it clear and honest.",
  "Add at least 4 real photos. The first one becomes your cover photo.",
  "Drop an exact pin and add the plot boundary if you have one.",
  "Check everything, confirm the details and submit for admin review.",
];

const YOUTUBE_PATTERN = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

function defaultForm(): PropertyForm {
  return {
    listingType: "sale",
    propertyType: "plot",
    title: "",
    description: "",
    price: "",
    areaValue: "",
    areaUnit: "sqft",
    address: "",
    locality: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "",
    latitude: null,
    longitude: null,
    boundary: [],
    images: [],
    youtubeUrl: "",
    nearby: [],
  };
}

function propertyToForm(property: Property): PropertyForm {
  return {
    listingType: property.listing_type,
    propertyType: property.property_type,
    title: property.title,
    description: property.description,
    price: String(property.price),
    areaValue: String(property.area_value),
    areaUnit: property.area_unit,
    address: property.address,
    locality: property.locality,
    city: property.city,
    state: property.state,
    pincode: property.pincode,
    latitude: property.latitude,
    longitude: property.longitude,
    boundary: property.boundary,
    images: property.images.map((uri) => ({ id: uri, uri })),
    youtubeUrl: property.youtube_url ?? "",
    nearby: property.nearby_landmarks.map((landmark) => ({ ...landmark })),
  };
}

function assetToImage(asset: ImagePicker.ImagePickerAsset, index: number): PropertyImage {
  return {
    id: asset.assetId ?? `pick-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    uri: asset.uri,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    base64: asset.base64,
  };
}

export function ListPropertyScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, refreshProfile } = useAuth();
  const { myProperties, loading, refresh } = useListings();
  const { showToast } = useToast();

  const editId = route.params?.editId;
  const isEditing = Boolean(editId);
  const existing = useMemo(
    () => (editId ? myProperties.find((property) => property.id === editId) : undefined),
    [editId, myProperties]
  );

  const [form, setForm] = useState<PropertyForm>(defaultForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hydrated, setHydrated] = useState(!editId);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const hydratedRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!editId || !existing || hydratedRef.current) return;
    hydratedRef.current = true;
    setForm(propertyToForm(existing));
    setHydrated(true);
  }, [editId, existing]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const defaultCenter = useMemo(() => {
    if (form.latitude !== null && form.longitude !== null) {
      return { latitude: form.latitude, longitude: form.longitude };
    }
    const city = CITIES.find((entry) => entry.city.toLowerCase() === form.city.toLowerCase());
    const fallback = city ?? CITIES[0];
    return { latitude: fallback.latitude, longitude: fallback.longitude };
  }, [form.city, form.latitude, form.longitude]);

  const tileSize = Math.floor((width - spacing.lg * 2 - 16) / 3);
  const canUseFreeListing = !profile?.free_listing_used;
  const isRent = form.listingType === "rent";
  const priceNumber = Number(form.price);
  const areaNumber = Number(form.areaValue);

  if (editId && !existing) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        {loading ? (
          <>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading your listing…</Text>
          </>
        ) : (
          <EmptyState
            icon={<LandPlot size={30} color={colors.primary} />}
            title="We couldn’t open this listing"
            body="It may have been deleted. Go back to My Listings and choose another property."
            actionLabel="Go back"
            onAction={() => navigation.goBack()}
          />
        )}
      </SafeAreaView>
    );
  }

  if (editId && !hydrated) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading your listing…</Text>
      </SafeAreaView>
    );
  }

  function setField<K extends keyof PropertyForm>(key: K, value: PropertyForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function clearError(key: keyof FormErrors) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateDetails() {
    const next: FormErrors = {};
    if (form.title.trim().length < 10) {
      next.title = "Give your listing a clear heading (at least 10 characters).";
    }
    if (form.description.trim().length < 40) {
      next.description = "Add at least 40 characters so buyers understand the property.";
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      next.price = "Enter a valid price in rupees.";
    }
    if (!Number.isFinite(areaNumber) || areaNumber <= 0) {
      next.area = "Enter the property area.";
    }
    if (form.youtubeUrl.trim() && !YOUTUBE_PATTERN.test(form.youtubeUrl.trim())) {
      next.youtube = "Enter a valid YouTube link, or leave this blank.";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      showToast("Please fix the highlighted fields.", "error");
      return false;
    }
    return true;
  }

  function validatePhotos() {
    if (form.images.length < 4) {
      setErrors((current) => ({
        ...current,
        images: `Add at least 4 photos. You currently have ${form.images.length}.`,
      }));
      showToast("A property needs at least 4 photos.", "error");
      return false;
    }
    clearError("images");
    return true;
  }

  function validateLocation() {
    const next: FormErrors = {};
    if (form.latitude === null || form.longitude === null) {
      next.location = "Tap the map to pin the property’s exact location.";
    }
    if (!form.address.trim()) next.address = "Enter the building, street or village.";
    if (!form.locality.trim()) next.locality = "Enter the locality or area name.";
    if (!form.city.trim()) next.city = "Enter the city.";
    if (!form.state.trim()) next.state = "Enter the state.";
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = "Enter a 6-digit PIN code.";
    setErrors(next);
    if (Object.keys(next).length) {
      showToast("Complete the address and pin the location.", "error");
      return false;
    }
    return true;
  }

  const goNext = () => {
    Keyboard.dismiss();
    if (step === 0 && !validateDetails()) return;
    if (step === 1 && !validatePhotos()) return;
    if (step === 2 && !validateLocation()) return;
    setStep((current) => Math.min(current + 1, 3));
  };

  const goBack = () => {
    if (step > 0) {
      setStep((current) => Math.max(current - 1, 0));
      return;
    }
    if (createdProperty) {
      Alert.alert(
        "Leave listing?",
        "Your draft is already saved in My Listings. You can complete the payment there any time.",
        [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Go to My Listings",
            onPress: () => navigation.navigate("Tabs", { screen: "Listings" }),
          },
        ]
      );
      return;
    }
    const hasData =
      form.title.trim() ||
      form.description.trim() ||
      form.images.length > 0 ||
      form.latitude !== null;
    if (!hasData && !isEditing) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      isEditing ? "Discard changes?" : "Discard this listing?",
      isEditing
        ? "Your edits won’t be saved. The listing will stay exactly as it is."
        : "The details you entered on this device will be lost.",
      [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
      ]
    );
  };

  const addImages = (assets: ImagePicker.ImagePickerAsset[]) => {
    const remaining = Math.max(0, 6 - form.images.length);
    if (remaining === 0) {
      showToast("You can add up to 6 photos.", "info");
      return;
    }
    const nextImages = assets
      .slice(0, remaining)
      .map((asset, index) => assetToImage(asset, index));
    setForm((current) => ({ ...current, images: [...current.images, ...nextImages] }));
    clearError("images");
  };

  const chooseFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photo access needed",
          "Allow photo access in Settings to add property pictures."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 6 - form.images.length),
        quality: 0.72,
        base64: true,
        exif: false,
      });
      if (!result.canceled) addImages(result.assets);
    } catch {
      showToast("Could not open your photo library.", "error");
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Camera access needed",
          "Allow camera access in Settings to photograph your property."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.72,
        base64: true,
        exif: false,
      });
      if (!result.canceled) addImages(result.assets);
    } catch {
      showToast("Could not open the camera.", "error");
    }
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const setCover = (index: number) => {
    setForm((current) => {
      if (index <= 0 || index >= current.images.length) return current;
      const images = [...current.images];
      const [chosen] = images.splice(index, 1);
      return { ...current, images: [chosen, ...images] };
    });
  };

  const photoActions = (index: number) => {
    if (index === 0) {
      Alert.alert("Cover photo", "This is your cover photo. It appears first on the listing.", [
        { text: "Remove photo", style: "destructive", onPress: () => removeImage(index) },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    Alert.alert("Photo options", "Choose what you’d like to do with this photo.", [
      { text: "Make cover", onPress: () => setCover(index) },
      { text: "Remove photo", style: "destructive", onPress: () => removeImage(index) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const updateLandmark = (index: number, patch: Partial<NearbyLandmark>) => {
    setForm((current) => ({
      ...current,
      nearby: current.nearby.map((landmark, landmarkIndex) =>
        landmarkIndex === index ? { ...landmark, ...patch } : landmark
      ),
    }));
  };

  const addLandmark = () => {
    if (form.nearby.length >= 5) {
      showToast("You can add up to 5 nearby landmarks.", "info");
      return;
    }
    setForm((current) => ({ ...current, nearby: [...current.nearby, { name: "", distance: "" }] }));
  };

  const removeLandmark = (index: number) => {
    setForm((current) => ({
      ...current,
      nearby: current.nearby.filter((_, landmarkIndex) => landmarkIndex !== index),
    }));
  };

  const handlePinChange = (latitude: number, longitude: number, place?: PickedPlace) => {
    setForm((current) => {
      const next: PropertyForm = { ...current, latitude, longitude };
      if (place) {
        if (place.address?.trim()) next.address = place.address.trim();
        if (place.locality?.trim()) next.locality = place.locality.trim();
        if (place.city?.trim()) next.city = place.city.trim();
        if (place.state?.trim()) next.state = place.state.trim();
        const pincode = place.pincode?.replace(/\D/g, "").slice(0, 6);
        if (pincode) next.pincode = pincode;
      }
      return next;
    });
    clearError("location");
  };

  const buildInput = (): PropertyDraftInput => {
    const rawYoutube = form.youtubeUrl.trim();
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      listing_type: form.listingType,
      property_type: form.propertyType,
      price: Math.round(Number(form.price)),
      area_value: Number(form.areaValue),
      area_unit: form.areaUnit,
      address: form.address.trim(),
      locality: form.locality.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      latitude: form.latitude ?? defaultCenter.latitude,
      longitude: form.longitude ?? defaultCenter.longitude,
      boundary: form.boundary.length >= 3 ? form.boundary : [],
      images: form.images,
      youtube_url: rawYoutube
        ? /^https?:\/\//i.test(rawYoutube)
          ? rawYoutube
          : `https://${rawYoutube}`
        : null,
      nearby_landmarks: form.nearby
        .filter((landmark) => landmark.name.trim())
        .map((landmark) => ({
          name: landmark.name.trim(),
          distance: landmark.distance.trim() || "Nearby",
        })),
    };
  };

  const submit = async () => {
    if (!confirmed) {
      showToast("Please confirm the declaration before submitting.", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing && editId) {
        await updateProperty(editId, buildInput());
        await resubmitProperty(editId);
        await refresh(true);
        showToast("Changes submitted for review.", "success");
        navigation.navigate("Tabs", { screen: "Listings" });
        return;
      }

      if (createdProperty) {
        setPaymentVisible(true);
        return;
      }

      const created = await createProperty(buildInput());
      setCreatedProperty(created);
      await refresh(true);
      setPaymentVisible(true);
    } catch (submitError) {
      showToast(
        submitError instanceof Error ? submitError.message : "Could not save your listing.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentClose = async () => {
    setPaymentVisible(false);
    await refresh(true);
    await refreshProfile();
    if (createdProperty) {
      showToast("Listing saved to My Listings.", "info");
      setCreatedProperty(null);
      navigation.navigate("Tabs", { screen: "Listings" });
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentVisible(false);
    setCreatedProperty(null);
    await refresh(true);
    await refreshProfile();
    showToast("Listing submitted for admin review.", "success");
    navigation.navigate("Tabs", { screen: "Listings" });
  };

  const primaryLabel =
    step < 3
      ? "Continue"
      : isEditing
        ? "Save & resubmit"
        : createdProperty
          ? "Complete listing payment"
          : canUseFreeListing
            ? "Publish my free listing"
            : `Continue to pay ₹${100}`;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.topBar}>
        <BackButton onPress={goBack} />
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>{isEditing ? "Edit listing" : "List a property"}</Text>
          <Text style={styles.topSub}>
            Step {step + 1} of 4 · {isEditing ? "Changes need admin review" : "Takes about 3 minutes"}
          </Text>
        </View>
        {isEditing && existing ? (
          <StatusPill status={existing.status} size="sm" />
        ) : (
          <View
            style={[
              styles.priceBadge,
              { backgroundColor: canUseFreeListing ? colors.goldSoft : colors.primarySoft },
            ]}
          >
            <Text
              style={[
                styles.priceBadgeText,
                { color: canUseFreeListing ? colors.goldDeep : colors.primary },
              ]}
            >
              {canUseFreeListing ? "FIRST FREE" : "₹100"}
            </Text>
          </View>
        )}
      </View>

      <ProgressSteps current={step} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isEditing && existing?.status === "declined" && existing.admin_note ? (
            <View style={styles.adminBanner}>
              <Info size={16} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.adminBannerTitle}>Changes requested by admin</Text>
                <Text style={styles.adminBannerText}>{existing.admin_note}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.intro}>
            <Text style={styles.stepEyebrow}>STEP {step + 1}</Text>
            <Text style={styles.headline}>{STEP_TITLES[step]}</Text>
            <Text style={styles.sub}>{STEP_SUBS[step]}</Text>
          </View>

          {step === 0 ? (
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <FieldLabel label="I want to" required />
                <View style={styles.segment}>
                  {LISTING_TYPES.map((entry) => {
                    const active = form.listingType === entry.id;
                    return (
                      <Pressable
                        key={entry.id}
                        onPress={() => setField("listingType", entry.id)}
                        style={[styles.segmentItem, active && styles.segmentItemActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={entry.label}
                      >
                        <Text style={[styles.segmentTitle, active && styles.segmentTitleActive]}>
                          {entry.id === "sale" ? "Sell" : "Rent out"}
                        </Text>
                        <Text style={[styles.segmentSub, active && styles.segmentSubActive]}>
                          {entry.id === "sale" ? "One-time price" : "Monthly rent"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <TextField
                label="Listing heading"
                required
                value={form.title}
                onChangeText={(value) => {
                  setField("title", value);
                  clearError("title");
                }}
                placeholder="e.g. 2,400 sq ft corner plot near Ring Road"
                maxLength={90}
                error={errors.title}
                hint={`${form.title.length}/90`}
              />

              <View style={styles.fieldGroup}>
                <FieldLabel label="Property type" required />
                <View style={styles.typeGrid}>
                  {PROPERTY_TYPES.map((entry) => {
                    const active = form.propertyType === entry.id;
                    return (
                      <Pressable
                        key={entry.id}
                        onPress={() => setField("propertyType", entry.id)}
                        style={[styles.typeCard, active && styles.typeCardActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={entry.label}
                      >
                        <View style={[styles.typeIcon, active && styles.typeIconActive]}>
                          {typeIcon(entry.id, active)}
                        </View>
                        <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                          {entry.label}
                        </Text>
                        {active ? (
                          <View style={styles.typeCheck}>
                            <Check size={9} color={colors.white} strokeWidth={3} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <TextField
                label="Description"
                required
                value={form.description}
                onChangeText={(value) => {
                  setField("description", value);
                  clearError("description");
                }}
                placeholder="Describe the property, access road, facing direction, water/electricity and why it’s a good buy."
                multiline
                maxLength={1200}
                error={errors.description}
                hint={`${form.description.length}/1200`}
              />

              <TextField
                label={isRent ? "Monthly rent" : "Asking price"}
                required
                value={form.price}
                onChangeText={(value) => {
                  setField("price", value.replace(/[^\d]/g, ""));
                  clearError("price");
                }}
                placeholder={isRent ? "e.g. 25000" : "e.g. 4500000"}
                keyboardType="number-pad"
                prefix="₹"
                error={errors.price}
                hint={
                  Number.isFinite(priceNumber) && priceNumber > 0
                    ? formatPrice(priceNumber, form.listingType)
                    : "In rupees"
                }
              />

              <TextField
                label="Total area"
                required
                value={form.areaValue}
                onChangeText={(value) => {
                  const cleaned = value
                    .replace(/[^\d.]/g, "")
                    .replace(/(\..*)\./g, "$1");
                  setField("areaValue", cleaned);
                  clearError("area");
                }}
                placeholder="e.g. 2400"
                keyboardType="decimal-pad"
                error={errors.area}
                hint={areaUnitLabel(form.areaUnit)}
              />

              <View style={styles.fieldGroup}>
                <FieldLabel label="Measure area in" required />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.unitRow}
                >
                  {AREA_UNITS.map((entry) => (
                    <Chip
                      key={entry.id}
                      label={entry.label}
                      active={form.areaUnit === entry.id}
                      onPress={() => setField("areaUnit", entry.id)}
                    />
                  ))}
                </ScrollView>
              </View>

              <TextField
                label="YouTube link"
                value={form.youtubeUrl}
                onChangeText={(value) => {
                  setField("youtubeUrl", value);
                  clearError("youtube");
                }}
                placeholder="https://youtube.com/watch?v=…"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                error={errors.youtube}
                hint="Optional · walkthrough or channel"
              />

              <View style={styles.tipCard}>
                <ShieldCheck size={17} color={colors.success} />
                <Text style={styles.tipText}>
                  Honest details and real photos get approved faster. You can edit before
                  publishing, but changes need a fresh admin review after going live.
                </Text>
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.form}>
              <View style={styles.photoHeader}>
                <View>
                  <Text style={styles.photoCount}>{form.images.length} of 6 photos</Text>
                  <Text style={styles.photoHint}>
                    {form.images.length < 4
                      ? `${4 - form.images.length} more required`
                      : "Minimum met — looking good"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.photoStatus,
                    form.images.length >= 4 ? styles.photoStatusReady : styles.photoStatusPending,
                  ]}
                >
                  {form.images.length >= 4 ? (
                    <Check size={12} color={colors.success} strokeWidth={3} />
                  ) : (
                    <ImagePlus size={12} color={colors.warning} />
                  )}
                  <Text
                    style={[
                      styles.photoStatusText,
                      { color: form.images.length >= 4 ? colors.success : colors.warning },
                    ]}
                  >
                    {form.images.length >= 4 ? "READY" : "4 MIN"}
                  </Text>
                </View>
              </View>

              <View style={[styles.photoGrid, { gap: 8 }]}>
                {form.images.map((image, index) => (
                  <Pressable
                    key={image.id}
                    onPress={() => photoActions(index)}
                    style={{ width: tileSize, height: tileSize }}
                    accessibilityRole="button"
                    accessibilityLabel={`Photo ${index + 1}${index === 0 ? ", cover photo" : ""}`}
                  >
                    <Image source={{ uri: image.uri }} style={styles.photo} />
                    {index === 0 ? (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>COVER</Text>
                      </View>
                    ) : (
                      <View style={styles.photoNumber}>
                        <Text style={styles.photoNumberText}>{index + 1}</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        removeImage(index);
                      }}
                      hitSlop={5}
                      style={styles.removePhoto}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${index + 1}`}
                    >
                      <X size={12} color={colors.white} strokeWidth={2.6} />
                    </Pressable>
                  </Pressable>
                ))}

                {form.images.length < 6 ? (
                  <Pressable
                    onPress={chooseFromGallery}
                    style={[styles.addTile, { width: tileSize, height: tileSize }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add property photos"
                  >
                    <View style={styles.addTileIcon}>
                      <Plus size={19} color={colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.addTileText}>Add photos</Text>
                  </Pressable>
                ) : null}
              </View>

              {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}

              <View style={styles.photoButtons}>
                <PrimaryButton
                  label="Choose from gallery"
                  variant="soft"
                  onPress={chooseFromGallery}
                  icon={<ImagePlus size={16} color={colors.primary} />}
                  compact
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label="Camera"
                  variant="outline"
                  onPress={takePhoto}
                  icon={<Camera size={16} color={colors.ink} />}
                  compact
                  style={{ flex: 0.62 }}
                />
              </View>

              <View style={styles.guidanceCard}>
                <Text style={styles.guidanceTitle}>Photos that sell</Text>
                {[
                  "Shoot in daylight and keep the horizon straight.",
                  "Show the road, entrance and all sides of the plot.",
                  "Skip screenshots, filters and watermarked images.",
                ].map((tip) => (
                  <View key={tip} style={styles.guidanceRow}>
                    <View style={styles.guidanceDot}>
                      <Check size={9} color={colors.white} strokeWidth={3} />
                    </View>
                    <Text style={styles.guidanceText}>{tip}</Text>
                  </View>
                ))}
                <Text style={styles.guidanceFine}>
                  Tap a photo to make it the cover or remove it.
                </Text>
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.form}>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                boundary={form.boundary}
                defaultCenter={defaultCenter}
                onPinChange={handlePinChange}
                onBoundaryChange={(points) => setField("boundary", points)}
              />
              {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}

              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Address details</Text>
                <Text style={styles.sectionSub}>
                  This is shown on the listing. The exact pin appears on the map.
                </Text>
              </View>

              <TextField
                label="Building / street / village"
                required
                value={form.address}
                onChangeText={(value) => {
                  setField("address", value);
                  clearError("address");
                }}
                placeholder="House no., street, landmark"
                error={errors.address}
              />

              <View style={styles.inputRow}>
                <TextField
                  label="Locality"
                  required
                  value={form.locality}
                  onChangeText={(value) => {
                    setField("locality", value);
                    clearError("locality");
                  }}
                  placeholder="e.g. Baner"
                  error={errors.locality}
                  containerStyle={{ flex: 1.4 }}
                />
                <TextField
                  label="PIN code"
                  required
                  value={form.pincode}
                  onChangeText={(value) => {
                    setField("pincode", value.replace(/\D/g, "").slice(0, 6));
                    clearError("pincode");
                  }}
                  placeholder="411045"
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.pincode}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.inputRow}>
                <TextField
                  label="City"
                  required
                  value={form.city}
                  onChangeText={(value) => {
                    setField("city", value);
                    clearError("city");
                  }}
                  placeholder="Pune"
                  error={errors.city}
                  containerStyle={{ flex: 1 }}
                />
                <TextField
                  label="State"
                  required
                  value={form.state}
                  onChangeText={(value) => {
                    setField("state", value);
                    clearError("state");
                  }}
                  placeholder="Maharashtra"
                  error={errors.state}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.landmarkSection}>
                <View style={styles.landmarkHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Nearby landmarks</Text>
                    <Text style={styles.sectionSub}>
                      Optional · help buyers understand the location
                    </Text>
                  </View>
                  <Pressable
                    onPress={addLandmark}
                    style={styles.addLandmark}
                    accessibilityRole="button"
                    accessibilityLabel="Add nearby landmark"
                  >
                    <Plus size={14} color={colors.primary} strokeWidth={2.6} />
                    <Text style={styles.addLandmarkText}>Add</Text>
                  </Pressable>
                </View>

                {form.nearby.length ? (
                  <View style={styles.landmarkList}>
                    {form.nearby.map((landmark, index) => (
                      <View key={`landmark-${index}`} style={styles.landmarkRow}>
                        <TextField
                          value={landmark.name}
                          onChangeText={(value) => updateLandmark(index, { name: value })}
                          placeholder="e.g. Railway station"
                          containerStyle={{ flex: 1.5 }}
                        />
                        <TextField
                          value={landmark.distance}
                          onChangeText={(value) => updateLandmark(index, { distance: value })}
                          placeholder="2 km"
                          containerStyle={{ flex: 0.8 }}
                        />
                        <Pressable
                          onPress={() => removeLandmark(index)}
                          style={styles.removeLandmark}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove landmark ${index + 1}`}
                        >
                          <Trash2 size={15} color={colors.danger} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Pressable onPress={addLandmark} style={styles.landmarkEmpty}>
                    <MapPinned size={20} color={colors.faint} strokeWidth={1.8} />
                    <Text style={styles.landmarkEmptyText}>
                      Add schools, stations, highways or markets nearby
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.form}>
              <ReviewCard title="Your listing" onEdit={() => setStep(0)}>
                <View style={styles.preview}>
                  {form.images[0] ? (
                    <Image source={{ uri: form.images[0].uri }} style={styles.previewImage} />
                  ) : (
                    <View style={[styles.previewImage, styles.previewImageFallback]}>
                      <LandPlot size={24} color={colors.faint} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.previewTags}>
                      <Text style={styles.previewTag}>
                        {form.listingType === "sale" ? "FOR SALE" : "FOR RENT"}
                      </Text>
                      <Text style={styles.previewDot}>·</Text>
                      <Text style={styles.previewType}>{propertyTypeLabel(form.propertyType)}</Text>
                    </View>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {form.title}
                    </Text>
                    <Text style={styles.previewLocation} numberOfLines={1}>
                      {form.locality || form.city}, {form.city}
                    </Text>
                    <Text style={styles.previewPrice}>
                      {formatPrice(priceNumber, form.listingType)}
                    </Text>
                    <Text style={styles.previewArea}>
                      {formatArea(areaNumber, form.areaUnit)}
                    </Text>
                  </View>
                </View>
                <View style={styles.previewDescription}>
                  <Text style={styles.previewDescriptionText} numberOfLines={3}>
                    {form.description}
                  </Text>
                </View>
                {form.youtubeUrl ? (
                  <View style={styles.previewVideo}>
                    <Sparkles size={13} color={colors.primary} />
                    <Text style={styles.previewVideoText}>YouTube walkthrough included</Text>
                  </View>
                ) : null}
              </ReviewCard>

              <ReviewCard
                title="Photos"
                onEdit={() => setStep(1)}
                meta={`${form.images.length} photos`}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reviewPhotos}
                >
                  {form.images.map((image, index) => (
                    <View key={image.id} style={styles.reviewPhotoWrap}>
                      <Image source={{ uri: image.uri }} style={styles.reviewPhoto} />
                      {index === 0 ? (
                        <View style={styles.reviewCover}>
                          <Text style={styles.reviewCoverText}>COVER</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </ReviewCard>

              <ReviewCard
                title="Location"
                onEdit={() => setStep(2)}
                meta={
                  form.boundary.length >= 3
                    ? `Boundary · ${form.boundary.length} corners`
                    : "Pin only"
                }
              >
                {form.latitude !== null && form.longitude !== null ? (
                  <MiniMap
                    latitude={form.latitude}
                    longitude={form.longitude}
                    boundary={form.boundary}
                  />
                ) : null}
                <View style={styles.reviewAddress}>
                  <MapPin size={13} color={colors.primary} />
                  <Text style={styles.reviewAddressText}>
                    {[form.address, form.locality, form.city, form.state, form.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
                {form.nearby.filter((landmark) => landmark.name.trim()).length ? (
                  <View style={styles.reviewLandmarks}>
                    {form.nearby
                      .filter((landmark) => landmark.name.trim())
                      .map((landmark, index) => (
                        <View key={`review-landmark-${index}`} style={styles.reviewLandmark}>
                          <MapPin size={11} color={colors.muted} />
                          <Text style={styles.reviewLandmarkName} numberOfLines={1}>
                            {landmark.name}
                          </Text>
                          <Text style={styles.reviewLandmarkDistance}>
                            {landmark.distance || "Nearby"}
                          </Text>
                        </View>
                      ))}
                  </View>
                ) : (
                  <Text style={styles.noLandmarks}>No nearby landmarks added.</Text>
                )}
              </ReviewCard>

              <View style={styles.paymentCard}>
                {isEditing ? (
                  <>
                    <View style={[styles.paymentIcon, { backgroundColor: colors.successSoft }]}>
                      <ShieldCheck size={20} color={colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>No extra listing fee</Text>
                      <Text style={styles.paymentBody}>
                        This property has already been paid for. Saving changes sends it back
                        for a quick review.
                      </Text>
                    </View>
                  </>
                ) : canUseFreeListing ? (
                  <>
                    <View style={[styles.paymentIcon, { backgroundColor: colors.goldSoft }]}>
                      <Sparkles size={20} color={colors.goldDeep} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.freeTitleRow}>
                        <Text style={[styles.paymentTitle, { color: colors.goldDeep }]}>
                          First listing is free
                        </Text>
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>₹0</Text>
                        </View>
                      </View>
                      <Text style={[styles.paymentBody, { color: "#7A5A12" }]}>
                        No payment needed. This one-time benefit stays used even if you delete
                        the listing later.
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.paymentIcon, { backgroundColor: colors.violetSoft }]}>
                      <IndianRupee size={20} color={colors.violet} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.freeTitleRow}>
                        <Text style={[styles.paymentTitle, { color: colors.violetDark }]}>
                          Listing fee
                        </Text>
                        <Text style={styles.paymentAmount}>₹100</Text>
                      </View>
                      <Text style={[styles.paymentBody, { color: "#6F63A8" }]}>
                        Your free listing is already used. Pay securely via Razorpay after
                        confirming this step.
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {createdProperty ? (
                <View style={styles.draftBanner}>
                  <Info size={15} color={colors.warning} />
                  <Text style={styles.draftBannerText}>
                    Draft saved. Complete the payment to submit “{createdProperty.title}” for
                    review.
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => setConfirmed((current) => !current)}
                style={styles.confirmRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: confirmed }}
                accessibilityLabel="Confirm listing declaration"
              >
                <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                  {confirmed ? <Check size={13} color={colors.white} strokeWidth={3} /> : null}
                </View>
                <Text style={styles.confirmText}>
                  I confirm that I’m the owner or an authorised broker for this property and
                  the details above are accurate.
                </Text>
              </Pressable>

              <View style={styles.nextCard}>
                <Text style={styles.nextTitle}>What happens next</Text>
                <NextStep
                  number="1"
                  title={isEditing ? "Resubmitted" : "Submitted"}
                  body={
                    isEditing
                      ? "Your saved changes go back to the admin queue."
                      : "The listing enters the admin review queue."
                  }
                />
                <NextStep
                  number="2"
                  title="Reviewed"
                  body="Most listings are checked within 24 hours."
                />
                <NextStep
                  number="3"
                  title="Live or declined"
                  body="Approved listings go live. If declined, you can edit and resubmit free."
                  last
                />
              </View>

              <Text style={styles.terms}>
                By submitting, you agree to SystIO Land’s listing rules and privacy policy.
                Listings with misleading details can be removed.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.footerMeta}>
            <Text style={styles.footerStep}>STEP {step + 1} OF 4</Text>
            <Text style={styles.footerHint}>
              {step === 3
                ? isEditing
                  ? "Changes require admin approval"
                  : canUseFreeListing
                    ? "No payment for your first listing"
                    : "Secure Razorpay checkout"
                : "You can review everything before submitting"}
            </Text>
          </View>
          <View style={styles.footerRow}>
            {step > 0 ? (
              <PrimaryButton
                label="Back"
                variant="outline"
                onPress={goBack}
                compact
                icon={<ChevronLeft size={16} color={colors.ink} />}
                style={{ flex: 0.45 }}
              />
            ) : null}
            <PrimaryButton
              label={primaryLabel}
              onPress={step === 3 ? submit : goNext}
              loading={submitting}
              icon={
                step === 3 ? (
                  isEditing ? (
                    <Check size={16} color={colors.white} strokeWidth={2.6} />
                  ) : (
                    <Sparkles size={16} color={colors.white} />
                  )
                ) : (
                  <ChevronRight size={16} color={colors.white} strokeWidth={2.6} />
                )
              }
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      <PaymentModal
        visible={paymentVisible}
        property={createdProperty}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
}

function typeIcon(type: PropertyType, active: boolean) {
  const color = active ? colors.primary : colors.body;
  const size = 17;
  switch (type) {
    case "flat":
      return <Building size={size} color={color} strokeWidth={2} />;
    case "house":
      return <House size={size} color={color} strokeWidth={2} />;
    case "commercial":
      return <Store size={size} color={color} strokeWidth={2} />;
    case "agricultural":
      return <Sprout size={size} color={color} strokeWidth={2} />;
    default:
      return <LandPlot size={size} color={color} strokeWidth={2} />;
  }
}

function ReviewCard({
  title,
  meta,
  onEdit,
  children,
}: {
  title: string;
  meta?: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewTitle}>{title}</Text>
        {meta ? <Text style={styles.reviewMeta}>{meta}</Text> : null}
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={styles.reviewEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title.toLowerCase()}`}
        >
          <Pencil size={12} color={colors.primary} />
          <Text style={styles.reviewEditText}>Edit</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function NextStep({
  number,
  title,
  body,
  last = false,
}: {
  number: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <View style={styles.nextRow}>
      <View style={styles.nextLineWrap}>
        <View style={styles.nextNumber}>
          <Text style={styles.nextNumberText}>{number}</Text>
        </View>
        {!last ? <View style={styles.nextLine} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 13 }}>
        <Text style={styles.nextRowTitle}>{title}</Text>
        <Text style={styles.nextRowBody}>{body}</Text>
      </View>
    </View>
  );
}

function MiniMap({
  latitude,
  longitude,
  boundary,
}: {
  latitude: number;
  longitude: number;
  boundary: LatLng[];
}) {
  return (
    <View style={styles.miniMap}>
      <MapView
provider={MAP_PROVIDER}
                style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: boundary.length >= 3 ? 0.008 : 0.014,
          longitudeDelta: boundary.length >= 3 ? 0.008 : 0.014,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {boundary.length >= 3 ? (
          <Polygon
            coordinates={boundary}
            strokeColor="transparent"
            strokeWidth={0}
            fillColor="rgba(23,58,94,0.15)"
          />
        ) : null}
        {boundary.length >= 2 ? (
          <Polyline
            coordinates={[...boundary, boundary[0]]}
            strokeColor={colors.primary}
            strokeWidth={2.5}
            lineDashPattern={[9, 7]}
          />
        ) : null}
        <Marker coordinate={{ latitude, longitude }} pinColor={colors.primary} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    paddingTop: 4,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  topSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
    fontWeight: "500",
  },
  priceBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  priceBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 18,
    paddingBottom: spacing.xl,
  },
  adminBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F6C9CE",
    marginBottom: 4,
  },
  adminBannerTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.danger,
  },
  adminBannerText: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "#8F3A44",
    marginTop: 2,
  },
  intro: {
    marginBottom: 20,
  },
  stepEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1,
    marginTop: 3,
  },
  sub: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 5,
    maxWidth: 340,
  },
  form: {
    gap: 17,
  },
  fieldGroup: {
    gap: 8,
  },
  segment: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: colors.canvasDeep,
    padding: 4,
    borderRadius: radii.md,
  },
  segmentItem: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: "center",
    gap: 1,
  },
  segmentItemActive: {
    backgroundColor: colors.white,
    ...shadow.soft,
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.muted,
  },
  segmentTitleActive: {
    color: colors.ink,
  },
  segmentSub: {
    fontSize: 8.5,
    color: colors.faint,
    fontWeight: "500",
  },
  segmentSubActive: {
    color: colors.primary,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeCard: {
    width: "48.7%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconActive: {
    backgroundColor: colors.primarySoft,
  },
  typeLabel: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "700",
    color: colors.body,
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  typeCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  unitRow: {
    gap: 7,
    paddingRight: 8,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: "#1B6C42",
    fontWeight: "500",
  },
  photoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photoCount: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.ink,
  },
  photoHint: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  photoStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  photoStatusReady: {
    backgroundColor: colors.successSoft,
  },
  photoStatusPending: {
    backgroundColor: colors.warningSoft,
  },
  photoStatusText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: radii.md,
    backgroundColor: colors.canvasDeep,
  },
  coverBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(24,25,28,0.8)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  coverBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.4,
  },
  photoNumber: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(24,25,28,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoNumberText: {
    fontSize: 8.5,
    color: colors.white,
    fontWeight: "800",
  },
  removePhoto: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(24,25,28,0.76)",
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  addTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  addTileText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.primary,
  },
  errorText: {
    fontSize: 10.5,
    color: colors.danger,
    fontWeight: "600",
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 9,
  },
  guidanceCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    gap: 8,
  },
  guidanceTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.ink,
  },
  guidanceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  guidanceDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  guidanceText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    color: colors.body,
  },
  guidanceFine: {
    fontSize: 9,
    color: colors.faint,
    marginTop: 1,
  },
  sectionDivider: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 14,
  },
  inputRow: {
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
  },
  landmarkSection: {
    marginTop: 6,
    gap: 10,
  },
  landmarkHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addLandmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addLandmarkText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },
  landmarkList: {
    gap: 8,
  },
  landmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  removeLandmark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  landmarkEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  landmarkEmptyText: {
    flex: 1,
    fontSize: 10,
    color: colors.faint,
    lineHeight: 14,
  },
  preview: {
    flexDirection: "row",
    gap: 11,
  },
  previewImage: {
    width: 96,
    height: 100,
    borderRadius: radii.md,
    backgroundColor: colors.canvasDeep,
  },
  previewImageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewTag: {
    fontSize: 7.5,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 0.4,
  },
  previewDot: {
    color: colors.faint,
    fontSize: 9,
  },
  previewType: {
    fontSize: 8.5,
    color: colors.muted,
    fontWeight: "600",
  },
  previewTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 3,
  },
  previewLocation: {
    fontSize: 9.5,
    color: colors.muted,
    marginTop: 2,
  },
  previewPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.3,
    marginTop: 5,
  },
  previewArea: {
    fontSize: 9,
    color: colors.faint,
    marginTop: 1,
  },
  previewDescription: {
    backgroundColor: colors.canvas,
    borderRadius: radii.sm,
    padding: 10,
    marginTop: 10,
  },
  previewDescriptionText: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.body,
  },
  previewVideo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  previewVideoText: {
    fontSize: 9.5,
    color: colors.primary,
    fontWeight: "700",
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    gap: 10,
    ...shadow.soft,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.ink,
  },
  reviewMeta: {
    fontSize: 8.5,
    color: colors.faint,
    fontWeight: "600",
    flex: 1,
  },
  reviewEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewEditText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
  },
  reviewPhotos: {
    gap: 7,
  },
  reviewPhotoWrap: {
    width: 76,
    height: 66,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  reviewPhoto: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.canvasDeep,
  },
  reviewCover: {
    position: "absolute",
    left: 4,
    bottom: 4,
    backgroundColor: "rgba(24,25,28,0.74)",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  reviewCoverText: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.3,
  },
  miniMap: {
    height: 126,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.canvasDeep,
  },
  reviewAddress: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  reviewAddressText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: colors.body,
    fontWeight: "500",
  },
  reviewLandmarks: {
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 8,
  },
  reviewLandmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reviewLandmarkName: {
    flex: 1,
    fontSize: 9.5,
    color: colors.body,
    fontWeight: "500",
  },
  reviewLandmarkDistance: {
    fontSize: 9,
    color: colors.faint,
    fontWeight: "700",
  },
  noLandmarks: {
    fontSize: 9.5,
    color: colors.faint,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.ink,
  },
  freeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  freeBadge: {
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  freeBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#4A3403",
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.violetDark,
  },
  paymentBody: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    marginTop: 2,
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    padding: 10,
  },
  draftBannerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    color: "#7A5200",
    fontWeight: "600",
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  confirmText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.body,
    fontWeight: "500",
  },
  nextCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    gap: 0,
  },
  nextTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 10,
  },
  nextRow: {
    flexDirection: "row",
    gap: 9,
  },
  nextLineWrap: {
    alignItems: "center",
    width: 20,
  },
  nextNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  nextNumberText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: colors.primary,
  },
  nextLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.lineSoft,
    marginVertical: 3,
  },
  nextRowTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
  },
  nextRowBody: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    marginTop: 1,
  },
  terms: {
    fontSize: 9,
    lineHeight: 14,
    color: colors.faint,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    gap: 8,
    ...shadow.raised,
  },
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  footerStep: {
    fontSize: 7.5,
    fontWeight: "900",
    color: colors.faint,
    letterSpacing: 0.5,
  },
  footerHint: {
    flex: 1,
    fontSize: 8.5,
    color: colors.faint,
    textAlign: "right",
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    gap: 9,
  },
});
