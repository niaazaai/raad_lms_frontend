/**
 * User Management API endpoints
 */
export const USER_MANAGEMENT_ENDPOINTS = {
  // Users
  USERS: {
    BASE: "/users",
    BY_ID: (id: number) => `/users/${id}`,
  },

  // Roles
  ROLES: {
    BASE: "/roles",
    BY_ID: (id: number) => `/roles/${id}`,
  },

  // Permissions
  PERMISSIONS: {
    BASE: "/permissions",
    BY_ID: (id: number) => `/permissions/${id}`,
  },
} as const;

/**
 * Query keys for React Query
 */
export const USER_MANAGEMENT_QUERY_KEYS = {
  users: ["users"] as const,
  user: (id: number) => ["users", id] as const,
  roles: ["roles"] as const,
  role: (id: number) => ["roles", id] as const,
  permissions: ["permissions"] as const,
};
