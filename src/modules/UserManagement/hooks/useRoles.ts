import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useQueryApi, useMutationApi } from "@/hooks";
import { callApi } from "@/services";
import { RequestMethod } from "@/data/constants/methods";
import { USER_MANAGEMENT_ENDPOINTS, USER_MANAGEMENT_QUERY_KEYS } from "../data/constants/endpoints";
import { Role, Permission, CreateRoleData, UpdateRoleData } from "../data/models";

/**
 * Hook for fetching roles list
 */
export function useRoles(params?: Record<string, unknown>) {
  return useQueryApi<Role[]>({
    queryKey: [...USER_MANAGEMENT_QUERY_KEYS.roles, params],
    url: USER_MANAGEMENT_ENDPOINTS.ROLES.BASE,
    method: RequestMethod.GET,
    params,
  });
}

/**
 * Hook for fetching a single role
 */
export function useRole(id: number) {
  return useQueryApi<Role>({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.role(id),
    url: USER_MANAGEMENT_ENDPOINTS.ROLES.BY_ID(id),
    method: RequestMethod.GET,
    options: {
      enabled: !!id,
    },
  });
}

/**
 * Hook for creating a role
 */
export function useCreateRole() {
  return useMutationApi<Role, CreateRoleData>({
    url: USER_MANAGEMENT_ENDPOINTS.ROLES.BASE,
    method: RequestMethod.POST,
    invalidateKeys: [USER_MANAGEMENT_QUERY_KEYS.roles],
  });
}

/**
 * Hook for updating a role
 */
export function useUpdateRole(id: number) {
  return useMutationApi<Role, UpdateRoleData>({
    url: USER_MANAGEMENT_ENDPOINTS.ROLES.BY_ID(id),
    method: RequestMethod.PUT,
    invalidateKeys: [USER_MANAGEMENT_QUERY_KEYS.roles, USER_MANAGEMENT_QUERY_KEYS.role(id)],
  });
}

/**
 * Hook for deleting a role
 */
export function useDeleteRole(id: number) {
  return useMutationApi<void, void>({
    url: USER_MANAGEMENT_ENDPOINTS.ROLES.BY_ID(id),
    method: RequestMethod.DELETE,
    invalidateKeys: [USER_MANAGEMENT_QUERY_KEYS.roles],
  });
}

/**
 * Hook for deleting any role by ID (for use in list actions)
 */
export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await callApi<void>({
        url: USER_MANAGEMENT_ENDPOINTS.ROLES.BY_ID(id),
        method: RequestMethod.DELETE,
      });
      if (!response.ok) throw new Error(response.data?.message || "Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.roles });
    },
  });
}

/**
 * Hook for fetching permissions list
 */
export function usePermissions(params?: Record<string, unknown>) {
  return useQueryApi<Permission[]>({
    queryKey: [...USER_MANAGEMENT_QUERY_KEYS.permissions, params],
    url: USER_MANAGEMENT_ENDPOINTS.PERMISSIONS.BASE,
    method: RequestMethod.GET,
    params,
  });
}
