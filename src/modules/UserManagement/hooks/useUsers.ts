import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useQueryApi, useMutationApi } from "@/hooks";
import { callApi } from "@/services";
import { RequestMethod } from "@/data/constants/methods";
import { USER_MANAGEMENT_ENDPOINTS, USER_MANAGEMENT_QUERY_KEYS } from "../data/constants/endpoints";
import { UserManagement, CreateUserData, UpdateUserData } from "../data/models";

/**
 * Hook for fetching users list
 */
export function useUsers(params?: Record<string, unknown>) {
  return useQueryApi<UserManagement[]>({
    queryKey: [...USER_MANAGEMENT_QUERY_KEYS.users, params],
    url: USER_MANAGEMENT_ENDPOINTS.USERS.BASE,
    method: RequestMethod.GET,
    params,
  });
}

/**
 * Hook for fetching a single user
 */
export function useUser(id: number) {
  return useQueryApi<UserManagement>({
    queryKey: USER_MANAGEMENT_QUERY_KEYS.user(id),
    url: USER_MANAGEMENT_ENDPOINTS.USERS.BY_ID(id),
    method: RequestMethod.GET,
    options: {
      enabled: !!id,
    },
  });
}

/**
 * Hook for creating a user
 */
export function useCreateUser() {
  return useMutationApi<UserManagement, CreateUserData | Record<string, unknown>>({
    url: USER_MANAGEMENT_ENDPOINTS.USERS.BASE,
    method: RequestMethod.POST,
    hasFiles: true,
    invalidateKeys: [USER_MANAGEMENT_QUERY_KEYS.users],
  });
}

/**
 * Hook for updating a user
 */
export function useUpdateUser(id: number) {
  return useMutationApi<UserManagement, UpdateUserData | Record<string, unknown>>({
    url: USER_MANAGEMENT_ENDPOINTS.USERS.BY_ID(id),
    method: RequestMethod.PUT,
    hasFiles: true,
    invalidateKeys: [USER_MANAGEMENT_QUERY_KEYS.users, USER_MANAGEMENT_QUERY_KEYS.user(id)],
  });
}

/**
 * Hook for updating any user by ID (for use in list actions where id comes from row)
 */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateUserData | Record<string, unknown>;
    }) => {
      const response = await callApi<{ data: UserManagement }>({
        url: USER_MANAGEMENT_ENDPOINTS.USERS.BY_ID(id),
        method: RequestMethod.PUT,
        data,
        hasFiles: !!(
          data &&
          typeof data === "object" &&
          "avatar" in data &&
          data.avatar instanceof File
        ),
      });
      if (!response.ok) throw new Error(response.data?.message || "Update failed");
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.user(variables.id) });
    },
  });
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser(id: number) {
  return useMutationApi<void, void>({
    url: USER_MANAGEMENT_ENDPOINTS.USERS.BY_ID(id),
    method: RequestMethod.DELETE,
    invalidateKeys: [USER_MANAGEMENT_QUERY_KEYS.users],
  });
}

/**
 * Hook for deleting any user by ID (for use in list actions)
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await callApi<void>({
        url: USER_MANAGEMENT_ENDPOINTS.USERS.BY_ID(id),
        method: RequestMethod.DELETE,
      });
      if (!response.ok) throw new Error(response.data?.message || "Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.users });
    },
  });
}
