import { useAuth } from "../context/AuthContext";
export function useRequireAuth() {
  const { user, token, loading } = useAuth();
  return { user, token, loading };
}
