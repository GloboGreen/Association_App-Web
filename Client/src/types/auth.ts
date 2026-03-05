// src/types/auth.ts

export type Role = "ADMIN" | "OWNER" | "EMPLOYEE" | "USER";

export type AuthProvider = "local" | "google";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role?: Role;
  avatar?: string;

  provider?: AuthProvider; // <- used in ChangePassword

  whatsappNumber?: string;
  status?: string;

  BusinessType?: "WHOLESALE" | "RETAIL" | string;
  BusinessCategory?: string;
  RegistrationNumber?: string;
  shopName?: string;
  shopAddress?: {
    street?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  shopFront?: string;
  shopBanner?: string;

  verify_email?: boolean;
  isProfileVerified?: boolean;

  association?: string | { _id: string };

  last_login_date?: string | null;
  createdAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
