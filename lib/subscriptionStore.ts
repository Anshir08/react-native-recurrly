import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { useEffect, useState } from "react";

// Module-level state so subscriptions persist across tab navigations
// without requiring a context provider or an external state library.
let _subscriptions: Subscription[] = [...HOME_SUBSCRIPTIONS];
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

export function useSubscriptionStore() {
  const [, trigger] = useState(0);

  useEffect(() => {
    const refresh = () => trigger((n) => n + 1);
    _listeners.add(refresh);
    return () => {
      _listeners.delete(refresh);
    };
  }, []);

  return {
    subscriptions: _subscriptions,
    addSubscription: (sub: Subscription) => {
      _subscriptions = [sub, ..._subscriptions];
      _notify();
    },
  };
}
