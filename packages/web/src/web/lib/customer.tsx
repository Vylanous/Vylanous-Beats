import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CUSTOMER_TOKEN_KEY = "vb_customer_token_v1";

export type CustomerProfile = {
  id: string;
  email: string;
  displayName: string;
  marketingOptIn: boolean;
  createdAt?: string;
};
export type CustomerEntitlement = {
  id: string;
  orderId: string;
  beatId: string;
  beatTitle: string;
  licenseTier: string;
  licenseName: string;
  createdAt: string;
  downloadUrl: string;
};
export type CustomerDashboard = {
  customer: CustomerProfile;
  insights: { paidOrders: number; licensesOwned: number; totalSpentCents: number };
  orders: {
    id: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    paidAt: string | null;
  }[];
  entitlements: CustomerEntitlement[];
};

function storedToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(CUSTOMER_TOKEN_KEY);
}
export function customerFetch(path: string, init: RequestInit = {}) {
  const token = storedToken();
  return fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
async function customerJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await customerFetch(path, init);
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
  };
  if (!response.ok) throw new Error(payload.message || payload.error || "Request failed.");
  return payload;
}

type ContextValue = {
  ready: boolean;
  customer: CustomerProfile | null;
  dashboard: CustomerDashboard | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName?: string;
    marketingOptIn?: boolean;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  updatePreferences: (input: { displayName?: string; marketingOptIn?: boolean }) => Promise<void>;
};
const CustomerContext = createContext<ContextValue | null>(null);
type SessionResponse = { customer: CustomerProfile; session: { token: string; expiresAt: string } };

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const clear = useCallback(() => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    setCustomer(null);
    setDashboard(null);
  }, []);
  const refreshDashboard = useCallback(async () => {
    const next = await customerJson<CustomerDashboard>("/api/customer/dashboard");
    setCustomer(next.customer);
    setDashboard(next);
  }, []);
  useEffect(() => {
    if (!storedToken()) {
      setReady(true);
      return;
    }
    refreshDashboard()
      .catch(clear)
      .finally(() => setReady(true));
  }, [clear, refreshDashboard]);
  const saveSession = useCallback(
    async (result: SessionResponse) => {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, result.session.token);
      setCustomer(result.customer);
      await refreshDashboard();
    },
    [refreshDashboard],
  );
  const signIn = useCallback(
    async (email: string, password: string) =>
      saveSession(
        await customerJson<SessionResponse>("/api/customer/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      ),
    [saveSession],
  );
  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName?: string;
      marketingOptIn?: boolean;
    }) =>
      saveSession(
        await customerJson<SessionResponse>("/api/customer/register", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    [saveSession],
  );
  const signOut = useCallback(async () => {
    try {
      await customerJson("/api/customer/logout", { method: "POST" });
    } catch {
      /* local revocation still wins */
    } finally {
      clear();
    }
  }, [clear]);
  const updatePreferences = useCallback(
    async (input: { displayName?: string; marketingOptIn?: boolean }) => {
      const result = await customerJson<{ customer: CustomerProfile }>(
        "/api/customer/preferences",
        { method: "PATCH", body: JSON.stringify(input) },
      );
      setCustomer(result.customer);
      await refreshDashboard();
    },
    [refreshDashboard],
  );
  const value = useMemo(
    () => ({
      ready,
      customer,
      dashboard,
      signIn,
      signUp,
      signOut,
      refreshDashboard,
      updatePreferences,
    }),
    [ready, customer, dashboard, signIn, signUp, signOut, refreshDashboard, updatePreferences],
  );
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}
export function useCustomer() {
  const value = useContext(CustomerContext);
  if (!value) throw new Error("useCustomer must be used inside CustomerProvider");
  return value;
}
