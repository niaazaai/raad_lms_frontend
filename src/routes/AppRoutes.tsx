import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoutes from "./ProtectedRoutes";
import { AuthWrapper, ProtectedRoute } from "@/features/auth";
import Layout from "@/layouts/MainLayout";

// Auth pages
const LoginPage = lazy(() => import("@/pages/auth/Login"));
const RegisterPage = lazy(() => import("@/pages/auth/Register"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmail"));
const VerifyEmailSuccessPage = lazy(() => import("@/pages/auth/VerifyEmailSuccess"));
const VerifyEmailExpiredPage = lazy(() => import("@/pages/auth/VerifyEmailExpired"));

// Error pages
const NotFoundPage = lazy(() => import("@/pages/errors/NotFound"));
const UnauthorizedPage = lazy(() => import("@/pages/errors/Unauthorized"));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  const fallback = <PageLoader />;

  return (
    <Routes location={location}>
      {/* Protected routes: AuthWrapper + Layout wrap only this branch */}
      <Route element={<AuthWrapper><Layout /></AuthWrapper>}>
        {ProtectedRoutes.map((route, routeIndex) => {
          const routeKey = `protected-${routeIndex}-${route.path}`;
          const content = (
            <Suspense fallback={route.componentLoader || fallback}>
              <ProtectedRoute
                permission={route.permission}
                anyPermission={route.anyPermission}
              >
                <div className="page-transition">{route.component}</div>
              </ProtectedRoute>
            </Suspense>
          );
          return (
            <Route key={routeKey} path={route.path} element={content} />
          );
        })}
      </Route>

      {/* Auth routes (no layout) */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        }
      />
      <Route
        path="/verify-email"
        element={
          <Suspense fallback={<PageLoader />}>
            <VerifyEmailPage />
          </Suspense>
        }
      />
      <Route
        path="/verify-email/success"
        element={
          <Suspense fallback={<PageLoader />}>
            <VerifyEmailSuccessPage />
          </Suspense>
        }
      />
      <Route
        path="/verify-email/expired"
        element={
          <Suspense fallback={<PageLoader />}>
            <VerifyEmailExpiredPage />
          </Suspense>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />

      {/* Error Pages */}
      <Route
        path="/unauthorized"
        element={
          <Suspense fallback={<PageLoader />}>
            <UnauthorizedPage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
