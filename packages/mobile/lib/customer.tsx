import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState, createContext, useContext } from "react";
import {
  customerDashboard,
  customerLogin,
  customerLogout,
  customerRegister,
  getCustomerToken,
  setCustomerToken,
  type CustomerProfile,
  type CustomerDashboard,
} from "./api";

const CUSTOMER_TOKEN_KEY = "vb_customer_token_v1";

type CustomerContextValue = {
  ready: boolean;
  customer: CustomerProfile | null;
  dashboard: CustomerDashboard | null;
  refreshDashboard: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName?: string;
    marketingOptIn?: boolean;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

async function persistToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(CUSTOMER_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY);
  }
  setCustomerToken(token);
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);

  const refreshDashboard = useCallback(async () => {
    const next = await customerDashboard();
    setCustomer(next.customer);
    setDashboard(next);
  }, []);

  useEffect(() => {
    SecureStore.getItemAsync(CUSTOMER_TOKEN_KEY)
      .then(async (token) => {
        setCustomerToken(token);
        if (token) await refreshDashboard();
      })
      .catch(() => persistToken(null))
      .finally(() => setReady(true));
  }, [refreshDashboard]);

  const saveSession = useCallback(
    async (result: { customer: CustomerProfile; session: { token: string } }) => {
      await persistToken(result.session.token);
      setCustomer(result.customer);
      await refreshDashboard();
    },
    [refreshDashboard],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      await saveSession(await customerLogin({ email, password }));
    },
    [saveSession],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName?: string;
      marketingOptIn?: boolean;
    }) => {
      await saveSession(await customerRegister(input));
    },
    [saveSession],
  );

  const signOut = useCallback(async () => {
    try {
      if (getCustomerToken()) await customerLogout();
    } finally {
      await persistToken(null);
      setCustomer(null);
      setDashboard(null);
    }
  }, []);

  const value = useMemo(
    () => ({ ready, customer, dashboard, refreshDashboard, signIn, signUp, signOut }),
    [ready, customer, dashboard, refreshDashboard, signIn, signUp, signOut],
  );
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used inside CustomerProvider");
  return context;
}
