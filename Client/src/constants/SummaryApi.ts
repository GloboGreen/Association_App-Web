// src/constants/SummaryApi.ts

export const baseURL = import.meta.env.VITE_API_BASE ?? "";
const API_BASE = "/api";

/** 
 * Replace :params in URL templates safely.
 * Example: path("/user/:id", { id: 10 }) => "/user/10"
 */
export const path = (
  template: string,
  params: Record<string, string | number> = {}
) =>
  template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `:${key}`;
  });

const SummaryApi = {
  /* ----------------------------------
   * AUTH
   * ---------------------------------- */
  admin_stats: { method: "GET", url: `${API_BASE}/admin/stats` },
  // ✅ corrected name (your first file had "lregister")
  register: { method: "POST", url: `${API_BASE}/auth/register` },
  // Optional alias (remove later if not needed)
  lregister: { method: "POST", url: `${API_BASE}/auth/register` },

  login: { method: "POST", url: `${API_BASE}/auth/login` },

  send_verify_email_otp: {
    method: "POST",
    url: `${API_BASE}/auth/send-verify-email-otp`,
  },
  verify_email_otp: {
    method: "POST",
    url: `${API_BASE}/auth/verify-email-otp`,
  },

  // ✅ from second file
  forgot_password_otp: {
    method: "POST",
    url: `${API_BASE}/auth/forgot-password-otp`,
  },
  verify_forgot_password_otp: {
    method: "POST",
    url: `${API_BASE}/auth/verify-forgot-password-otp`,
  },
  reset_password: {
    method: "POST",
    url: `${API_BASE}/auth/reset-password`,
  },

  // ✅ OTP login (from your first file)
  send_login_otp: {
    method: "POST",
    url: `${API_BASE}/auth/send-login-otp`,
  },
  login_otp: { method: "POST", url: `${API_BASE}/auth/login-otp` },

  google_login: {
    method: "POST",
    url: `${API_BASE}/auth/google-login`,
  },

  // Keep both if your backend supports different ones in different apps
  me: { method: "GET", url: `${API_BASE}/auth/me` },
  auth_me: { method: "GET", url: `${API_BASE}/auth/me` },

  // ✅ from second file (if you use it in app)
  current_user: {
    method: "GET",
    url: `${API_BASE}/auth/current-user`,
  },

  change_password: {
    method: "POST",
    url: `${API_BASE}/auth/change-password`,
  },

  logout: { method: "POST", url: `${API_BASE}/auth/logout` },

  /* ----------------------------------
   * EMPLOYEE (from second file)
   * ---------------------------------- */
  employee_create: { method: "POST", url: `${API_BASE}/employee/create` },
  employee_my: { method: "GET", url: `${API_BASE}/employee/my` },
  employee_update: { method: "PATCH", url: `${API_BASE}/employee` },

  /* ----------------------------------
   * ASSOCIATION
   * ---------------------------------- */
  association_create: {
    method: "POST",
    url: `${API_BASE}/associations/createdassociations`,
  },
  association_list: {
    method: "GET",
    url: `${API_BASE}/associations/allassociations`,
  },
  association_detail: {
    method: "GET",
    url: `${API_BASE}/associations/:id`,
  },
  association_update: {
    method: "PATCH",
    url: `${API_BASE}/associations/:id`,
  },
  association_delete: {
    method: "DELETE",
    url: `${API_BASE}/associations/:id`,
  },

  // ✅ aliases from second file (optional)
  associations: {
    method: "GET",
    url: `${API_BASE}/associations/allassociations`,
  },
  getAssociationById: {
    method: "GET",
    url: `${API_BASE}/associations/:id`,
  },

  /* ----------------------------------
   * USERS
   * ---------------------------------- */
  user_profile_update: {
    method: "PATCH",
    url: `${API_BASE}/user/profile`,
  },
  user_list: { method: "GET", url: `${API_BASE}/user/all` },
  user_detail: { method: "GET", url: `${API_BASE}/user/:id` },
  user_update: { method: "PATCH", url: `${API_BASE}/user/:id` },
  user_delete: { method: "DELETE", url: `${API_BASE}/user/:id` },

  shop_list: {
    method: "GET",
    url: `${API_BASE}/user/alluser?type=shop`,
  },

  // ✅ from second file (string replace style endpoints)
  user_get_by_id: {
    method: "GET",
    url: `${API_BASE}/user/ID_REPLACE`,
  },
  user_get_by_mobile: {
    method: "GET",
    url: `${API_BASE}/user/profile/MOBILE_REPLACE`,
  },

  /* ----------------------------------
   * QR CODE (from second file)
   * ---------------------------------- */
  my_qr: { method: "GET", url: `${API_BASE}/qr/my` },
  qr_scan: { method: "POST", url: `${API_BASE}/qr/scan` },
  qr_history: { method: "GET", url: `${API_BASE}/qr/history` },

  /* ----------------------------------
   * LOCATIONS (from second file)
   * ---------------------------------- */
  locations_states: {
    method: "GET",
    url: `${API_BASE}/locations/states`,
  },
  locations_districts: {
    method: "GET",
    url: `${API_BASE}/locations/districts`,
  },
  locations_taluks: {
    method: "GET",
    url: `${API_BASE}/locations/taluks`,
  },
  locations_villages: {
    method: "GET",
    url: `${API_BASE}/locations/villages`,
  },

  /* ----------------------------------
   * KYC (from second file)
   * ---------------------------------- */
  kyc_me: { method: "GET", url: `${API_BASE}/kyc/me` },
  kyc_upload: { method: "POST", url: `${API_BASE}/kyc/upload` },  
  kyc_by_owner: { method: "GET", url: `${API_BASE}/kyc/owner/:ownerId` },
  kyc_admin_review: { method: "PATCH", url: `${API_BASE}/kyc/admin/:kycId/review` },
  /* ----------------------------------
   * SUBSCRIPTIONS
   * ---------------------------------- */

  subscription_create_update: { method: "POST", url: `${API_BASE}/subscriptions/:memberId` },
subscription_by_member: { method: "GET", url: `${API_BASE}/subscriptions/member/:memberId` },
subscription_all: { method: "GET", url: `${API_BASE}/subscriptions/admin/all` },
sub_user_list: { method: "GET", url: `${API_BASE}/user/list` },

  /* ----------------------------------
   * SUBSCRIPTION (ADMIN)
   * ---------------------------------- */
  sub_upsert: { method: "POST", url: `${API_BASE}/subscriptions/:memberId` },
  sub_member_history: { method: "GET", url: `${API_BASE}/subscriptions/member/:memberId` },
  sub_all_history: { method: "GET", url: `${API_BASE}/subscriptions/admin/all` },

add_brand: { method: "POST", url: `${API_BASE}/brand/add-brand` },
get_brands: { method: "GET", url: `${API_BASE}/brand/get-brands` },
update_brand: { method: "PUT", url: `${API_BASE}/brand/update-brand` },
hard_delete_brand: { method: "DELETE", url: `${API_BASE}/brand/hard-delete-brand/:id` },

// Series
add_series: { method: "POST", url: `${API_BASE}/series/add-series` },
get_series: { method: "GET", url: `${API_BASE}/series/get-series` }, // supports ?brandId=
update_series: { method: "PUT", url: `${API_BASE}/series/update-series` },
hard_delete_series: { method: "DELETE", url: `${API_BASE}/series/hard-delete-series/:id` },

add_model: { method: "POST", url: `${API_BASE}/model/add-model` },
get_models: { method: "GET", url: `${API_BASE}/model/get-models` },
update_model: { method: "PUT", url: `${API_BASE}/model/update-model` },
hard_delete_model: { method: "DELETE", url: `${API_BASE}/model/hard-delete-model/:id` },
};

export default SummaryApi;
