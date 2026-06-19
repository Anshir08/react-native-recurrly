import SubscriptionCard from "@/components/SubscriptionCard";
import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { components } from "@/constants/theme";
import { filterSubscriptions } from "@/lib/utils";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const tabBar = components.tabBar;

  const filteredSubscriptions = useMemo(
    () => filterSubscriptions(HOME_SUBSCRIPTIONS, query),
    [query],
  );

  const listBottomPadding =
    Math.max(insets.bottom, tabBar.horizontalInset) + tabBar.height + 24;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: listBottomPadding,
        }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="subs-header">
            <Text className="subs-title">Subscriptions</Text>
            <TextInput
              className="subs-search"
              placeholder="Search by name, category, or plan"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            <Text className="subs-count">
              {filteredSubscriptions.length}{" "}
              {filteredSubscriptions.length === 1
                ? "subscription"
                : "subscriptions"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="subs-empty">
            {query.trim()
              ? "No subscriptions match your search."
              : "No subscriptions yet."}
          </Text>
        }
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedId === item.id}
            onPress={() =>
              setExpandedId((current) =>
                current === item.id ? null : item.id,
              )
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Subscriptions;
