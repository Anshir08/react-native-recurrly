import { icons } from "@/constants/icons";
import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

type Frequency = "Monthly" | "Yearly";

type Category =
  | "Entertainment"
  | "AI Tools"
  | "Developer Tools"
  | "Design"
  | "Productivity"
  | "Cloud"
  | "Music"
  | "Other";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
];

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#f5c542",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#b8e8d0",
  Productivity: "#ffd6a5",
  Cloud: "#c8e6ff",
  Music: "#ffc8d4",
  Other: "#e8e8e8",
};

const PLACEHOLDER_COLOR = "rgba(8, 17, 38, 0.35)";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRenewalDate(frequency: Frequency): string {
  return frequency === "Monthly"
    ? dayjs().add(1, "month").toISOString()
    : dayjs().add(1, "year").toISOString();
}

function generateId(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const CreateSubscriptionModal = ({ visible, onClose, onSubmit }: Props) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<Category>("Entertainment");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  const reset = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
    setNameError("");
    setPriceError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    let valid = true;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required.");
      valid = false;
    } else {
      setNameError("");
    }

    const parsedPrice = parseFloat(price);
    if (!price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      setPriceError("Enter a valid price greater than 0.");
      valid = false;
    } else {
      setPriceError("");
    }

    if (!valid) return;

    const now = dayjs().toISOString();

    const subscription: Subscription = {
      id: generateId(trimmedName),
      name: trimmedName,
      price: parsedPrice,
      currency: "USD",
      billing: frequency,
      category,
      plan: "",
      paymentMethod: "",
      status: "active",
      startDate: now,
      renewalDate: buildRenewalDate(frequency),
      color: CATEGORY_COLORS[category],
      icon: icons.wallet,
    };

    onSubmit(subscription);
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="modal-overlay">
        {/* Backdrop fills the screen behind the sheet; tap to dismiss. */}
        <Pressable className="modal-backdrop" onPress={handleClose} />

        {/* Bottom-anchored sheet */}
        <View className="flex-1 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View className="modal-container">
              <View className="modal-header">
                <Text className="modal-title">New Subscription</Text>
                <Pressable
                  className="modal-close"
                  onPress={handleClose}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <Text className="modal-close-text">✕</Text>
                </Pressable>
              </View>

              <ScrollView
                className="modal-body"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
                {/* Name */}
                <View className="create-field">
                  <Text className="create-label">Name</Text>
                  <TextInput
                    className={clsx("auth-input", nameError && "auth-input-error")}
                    placeholder="e.g. Netflix"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={name}
                    onChangeText={(t) => {
                      setName(t);
                      if (nameError) setNameError("");
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  {nameError ? (
                    <Text className="create-error">{nameError}</Text>
                  ) : null}
                </View>

                {/* Price */}
                <View className="create-field">
                  <Text className="create-label">Price</Text>
                  <View
                    className={clsx(
                      "create-price-row",
                      priceError && "create-price-input-error",
                    )}
                  >
                    <Text className="create-price-currency">$</Text>
                    <TextInput
                      className="create-price-input"
                      placeholder="0.00"
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      value={price}
                      onChangeText={(t) => {
                        setPrice(t);
                        if (priceError) setPriceError("");
                      }}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  </View>
                  {priceError ? (
                    <Text className="create-error">{priceError}</Text>
                  ) : null}
                </View>

                {/* Frequency */}
                <View className="create-field">
                  <Text className="create-label">Billing frequency</Text>
                  <View className="picker-row">
                    {(["Monthly", "Yearly"] as Frequency[]).map((f) => (
                      <Pressable
                        key={f}
                        className={clsx(
                          "picker-option",
                          frequency === f && "picker-option-active",
                        )}
                        onPress={() => setFrequency(f)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: frequency === f }}
                      >
                        <Text
                          className={clsx(
                            "picker-option-text",
                            frequency === f && "picker-option-text-active",
                          )}
                        >
                          {f}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Category */}
                <View className="create-field">
                  <Text className="create-label">Category</Text>
                  <View className="category-scroll">
                    {CATEGORIES.map((c) => (
                      <Pressable
                        key={c}
                        className={clsx(
                          "category-chip",
                          category === c && "category-chip-active",
                        )}
                        onPress={() => setCategory(c)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: category === c }}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            category === c && "category-chip-text-active",
                          )}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Submit */}
                <Pressable
                  className={clsx(
                    "auth-button",
                    (!name.trim() || !price.trim()) && "auth-button-disabled",
                  )}
                  onPress={handleSubmit}
                  accessibilityRole="button"
                >
                  <Text className="auth-button-text">Add Subscription</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

export default CreateSubscriptionModal;
