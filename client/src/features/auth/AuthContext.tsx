import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/toast";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: userData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await api.get<{ user: User }>("/auth/me");
        return res.data?.user ?? null;
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          return null;
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const user = userData ?? null;

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await api.post<{ user: User }>("/auth/login", { email, password });
      return res.data.user;
    },
    onSuccess: (newUser) => {
      queryClient.setQueryData(["auth", "me"], newUser);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Welcome back!", `Signed in as ${newUser.name}`);
    },
    onError: (err: ApiError) => {
      toast.error("Sign in failed", err.message || "Invalid email or password");
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const res = await api.post<{ user: User }>("/auth/signup", { name, email, password });
      return res.data.user;
    },
    onSuccess: (newUser) => {
      queryClient.setQueryData(["auth", "me"], newUser);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Account created!", `Welcome to ShipYard, ${newUser.name}!`);
    },
    onError: (err: ApiError) => {
      toast.error("Sign up failed", err.message || "Could not complete registration");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      toast.info("Signed out", "You have been safely signed out.");
    },
    onError: () => {
      queryClient.setQueryData(["auth", "me"], null);
    },
  });

  const login = React.useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const signup = React.useCallback(
    async (name: string, email: string, password: string) => {
      await signupMutation.mutateAsync({ name, email, password });
    },
    [signupMutation]
  );

  const logout = React.useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        signup,
        logout,
        refetchUser: refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
