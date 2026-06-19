import "@/global.css";
import React, { useMemo, useState } from "react";
import { FlatList as _FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import images from "@/constants/images";
import { HOME_BALANCE } from "@/constants/data";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import { useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import { useSubscriptionStore } from "@/lib/subscriptionStore";

const SafeAreaView = styled(RNSafeAreaView);

// NativeWind v5 narrows FlatList's TS type, stripping inherited ScrollView
// props (contentContainerClassName, showsVerticalScrollIndicator, …).
// Casting to ComponentType<any> restores full prop access at the type level.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlatList = _FlatList as React.ComponentType<any>;

export default function App() {
    const { user } = useUser();
    const posthog = usePostHog();
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { subscriptions, addSubscription } = useSubscriptionStore();

    // Upcoming: active subscriptions renewing within the next 30 days.
    const upcomingSubscriptions = useMemo((): UpcomingSubscription[] => {
        const now = dayjs();
        const cutoff = now.add(30, "days");
        return subscriptions
            .filter((sub: Subscription) =>
                sub.status === "active" &&
                dayjs(sub.renewalDate).isAfter(now) &&
                dayjs(sub.renewalDate).isBefore(cutoff),
            )
            .sort((a: Subscription, b: Subscription) =>
                dayjs(a.renewalDate).diff(dayjs(b.renewalDate)),
            )
            .map((sub: Subscription): UpcomingSubscription => ({
                id: sub.id,
                icon: sub.icon,
                name: sub.name,
                price: sub.price,
                currency: sub.currency,
                daysLeft: Math.max(
                    1,
                    Math.ceil(dayjs(sub.renewalDate).diff(now, "day", true)),
                ),
            }));
    }, [subscriptions]);

    const handleSubscriptionPress = (item: Subscription) => {
        const isExpanding = expandedSubscriptionId !== item.id;
        setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id));
        posthog.capture(isExpanding ? "subscription_expanded" : "subscription_collapsed", {
            name: item.name,
            id: item.id,
            category: item.category,
            billing: item.billing,
        });
    };

    const handleCreateSubscription = (newSubscription: Subscription) => {
        addSubscription(newSubscription);
        posthog.capture("subscription_created", {
            name: newSubscription.name,
            price: newSubscription.price,
            billing: newSubscription.billing,
            category: newSubscription.category,
            currency: newSubscription.currency,
        });
    };

    const displayName =
        user?.firstName ||
        user?.username ||
        user?.primaryEmailAddress?.emailAddress ||
        "User";

    const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;

    // ── extracted header so it never remounts on state changes ──────────────
    const listHeader = (
        <>
            <View className="home-header">
                <View className="home-user">
                    <Image source={avatarSource} className="home-avatar" />
                    <Text className="home-user-name" numberOfLines={1} ellipsizeMode="tail">
                        {displayName}
                    </Text>
                </View>

                {/* Pressable wraps a View for the visual circle — NativeWind v5
                    does not reliably apply bg/layout classes to Pressable itself. */}
                <Pressable
                    onPress={() => setIsModalVisible(true)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Add subscription"
                >
                    <View className="home-add-btn">
                        <Text
                            className="home-add-text"
                            style={{
                                includeFontPadding: false,
                                lineHeight: 28,
                                textAlign: "center",
                                transform: [{ translateY: -3 }],
                            }}
                        >
                            +
                        </Text>
                    </View>
                </Pressable>
            </View>

            <View className="home-balance-card">
                <Text className="home-balance-label">Balance</Text>
                <View className="home-balance-row">
                    <Text className="home-balance-amount">
                        {formatCurrency(HOME_BALANCE.amount)}
                    </Text>
                    <Text className="home-balance-date">
                        {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                    </Text>
                </View>
            </View>

            <View className="mb-5">
                <ListHeading title="Upcoming" />
                <FlatList
                    data={upcomingSubscriptions}
                    renderItem={({ item }: { item: UpcomingSubscription }) => (
                        <UpcomingSubscriptionCard {...item} />
                    )}
                    keyExtractor={(item: UpcomingSubscription) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text className="home-empty-state">No upcoming renewals yet.</Text>
                    }
                />
            </View>

            <ListHeading title="All Subscriptions" />
        </>
    );

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <FlatList
                ListHeaderComponent={() => listHeader}
                data={subscriptions}
                keyExtractor={(item: Subscription) => item.id}
                renderItem={({ item }: { item: Subscription }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => handleSubscriptionPress(item)}
                    />
                )}
                extraData={expandedSubscriptionId}
                ItemSeparatorComponent={() => <View className="h-4" />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text className="home-empty-state">No subscriptions yet.</Text>
                }
                contentContainerClassName="pb-30"
            />

            <CreateSubscriptionModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleCreateSubscription}
            />
        </SafeAreaView>
    );
}
