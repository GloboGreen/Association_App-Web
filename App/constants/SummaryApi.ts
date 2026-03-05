// app/constants/SummaryApi.ts

export const baseURL = "https://association-app-479407.de.r.appspot.com";
// ✅ NO trailing slash
console.log("🔗 API baseURL =", baseURL);

const API_BASE = "/api";

const SummaryApi = {
  /* ----------------------------------
   * AUTH
   * ---------------------------------- */
  register: { method: "POST", url: `${API_BASE}/auth/register` },
  login: { method: "POST", url: `${API_BASE}/auth/login` },

  send_verify_email_otp: {
    method: "POST",
    url: `${API_BASE}/auth/send-verify-email-otp`,
  },
  verify_email_otp: {
    method: "POST",
    url: `${API_BASE}/auth/verify-email-otp`,
  },

  forgot_password_otp: {
    method: "POST",
    url: `${API_BASE}/auth/forgot-password-otp`,
  },
  verify_forgot_password_otp: {
    method: "POST",
    url: `${API_BASE}/auth/verify-forgot-password-otp`,
  },
  reset_password: { method: "POST", url: `${API_BASE}/auth/reset-password` },

  current_user: { method: "GET", url: `${API_BASE}/auth/current-user` },
  change_password: { method: "POST", url: `${API_BASE}/auth/change-password` },
  logout: { method: "POST", url: `${API_BASE}/auth/logout` },

  /* ----------------------------------
   * EMPLOYEE
   * ---------------------------------- */
  employee_create: { method: "POST", url: `${API_BASE}/employee/create` },
  employee_my: { method: "GET", url: `${API_BASE}/employee/my` },
  employee_update: { method: "PATCH", url: `${API_BASE}/employee` },

  /* ----------------------------------
   * ASSOCIATIONS
   * ---------------------------------- */
  associations: { method: "GET", url: `${API_BASE}/associations/allassociations` },
  getAssociationById: { method: "GET", url: `${API_BASE}/associations/:id` },

  /* ----------------------------------
   * USER PROFILE
   * ---------------------------------- */
  user_update_profile: { method: "PATCH", url: `${API_BASE}/user/profile` },
  user_get_by_id: { method: "GET", url: `${API_BASE}/user/ID_REPLACE` },
  user_get_by_mobile: { method: "GET", url: `${API_BASE}/user/profile/MOBILE_REPLACE` },

  /* ----------------------------------
   * QR CODE
   * ---------------------------------- */
  my_qr: { method: "GET", url: `${API_BASE}/qr/my` },
  qr_scan: { method: "POST", url: `${API_BASE}/qr/scan` },
  qr_history: { method: "GET", url: `${API_BASE}/qr/history` },

  /* ----------------------------------
   * SUBSCRIPTIONS
   * ---------------------------------- */
  subscription_by_member: {
    method: "GET",
    url: `${API_BASE}/subscriptions/member/:memberId`,
  },
  subscription_my: { method: "GET", url: `${API_BASE}/subscriptions/my` },

  /* ----------------------------------
   * LOCATIONS
   * ---------------------------------- */
  locations_states: { method: "GET", url: `${API_BASE}/locations/states` },
  locations_districts: { method: "GET", url: `${API_BASE}/locations/districts` },
  locations_taluks: { method: "GET", url: `${API_BASE}/locations/taluks` },
  locations_villages: { method: "GET", url: `${API_BASE}/locations/villages` },

  /* ----------------------------------
   * KYC
   * ---------------------------------- */
  kyc_me: { method: "GET", url: `${API_BASE}/kyc/me` },
  kyc_upload: { method: "POST", url: `${API_BASE}/kyc/upload` },

  /* ----------------------------------
   * SELL PHONE (BRAND / SERIES / MODEL)
   * ---------------------------------- */
  add_brand: { method: "POST", url: `${API_BASE}/brand/add-brand` },
  get_brands: { method: "GET", url: `${API_BASE}/brand/get-brands` },
  update_brand: { method: "PUT", url: `${API_BASE}/brand/update-brand` },
  hard_delete_brand: { method: "DELETE", url: `${API_BASE}/brand/hard-delete-brand/:id` },

  add_series: { method: "POST", url: `${API_BASE}/series/add-series` },
  get_series: { method: "GET", url: `${API_BASE}/series/get-series` }, // ?brandId=
  update_series: { method: "PUT", url: `${API_BASE}/series/update-series` },
  hard_delete_series: { method: "DELETE", url: `${API_BASE}/series/hard-delete-series/:id` },

  add_model: { method: "POST", url: `${API_BASE}/model/add-model` },
  get_models: { method: "GET", url: `${API_BASE}/model/get-models` }, // ?seriesId=
  update_model: { method: "PUT", url: `${API_BASE}/model/update-model` },
  hard_delete_model: { method: "DELETE", url: `${API_BASE}/model/hard-delete-model/:id` },

spareparts_upload: { method: "POST", url: `${API_BASE}/spareparts/upload` },
spareparts_create: { method: "POST", url: `${API_BASE}/spareparts/create` },

spareparts_my: { method: "GET", url: `${API_BASE}/spareparts/my` },
spareparts_admin_all: { method: "GET", url: `${API_BASE}/spareparts/admin/all` },
spareparts_get_one: { method: "GET", url: `${API_BASE}/spareparts/:id` },
spareparts_by_model: { method: "GET", url: `${API_BASE}/spareparts/model/:modelId` },

spareparts_delete_one: { method: "DELETE", url: `${API_BASE}/spareparts/:id` },
spareparts_delete_item_image: { method: "DELETE", url: `${API_BASE}/spareparts/:id/item/:partKey` },

};

export default SummaryApi;

export const path = (
  template: string,
  params: Record<string, string | number>
) =>
  template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `:${key}`;
  });
