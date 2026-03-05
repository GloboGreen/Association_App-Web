// src/router/index.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Login from "../pages/Login";
import ProtectedRoute from "../components/ProtectedRoute";

import AssociationCreate from "@/pages/admin/AssociationCreate";
import AssociationList from "@/pages/admin/AssociationList";
import AssociationEdit from "@/pages/admin/AssociationEdit";
import UserList from "@/pages/admin/UserList";
import ShopList from "@/pages/admin/ShopList";
import MyProfile from "@/pages/admin/MyProfile";
import UserDetail from "@/pages/admin/UserDetail";
import MemberSubscriptionPage from "@/pages/admin/MemberSubscriptionPage";
import SubscriptionHistoryPage from "@/pages/admin/SubscriptionHistoryPage";
import BrandPage from "@/pages/admin/BrandPage";
import SeriesPage from "@/pages/admin/SeriesPage";
import ModelPage from "@/pages/admin/ModelPage";

const router = createBrowserRouter([
  // Root → login
  { path: "/", element: <Navigate to="/login" replace /> },

  // Login
  { path: "/login", element: <Login /> },

  // Admin (protected)
  {
    path: "/admin",
    element: (
      <ProtectedRoute role="ADMIN">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },

      { path: "association/create", element: <AssociationCreate /> },
      { path: "association/list", element: <AssociationList /> },
      { path: "association/:id/edit", element: <AssociationEdit /> },

      { path: "profile", element: <MyProfile /> },

      { path: "users", element: <UserList /> },
      { path: "users/:id", element: <UserDetail /> },

      { path: "shops", element: <ShopList /> },
      { path: "subscription/update", element: <MemberSubscriptionPage /> },
      { path: "subscription/history", element: <SubscriptionHistoryPage /> },
      { path: "Brand", element: <BrandPage />},
      { path: "Series", element: <SeriesPage />},
      { path: "Model", element: <ModelPage />},
    ],
  },

  { path: "*", element: <div>Not found</div> },
]);

export default router;
