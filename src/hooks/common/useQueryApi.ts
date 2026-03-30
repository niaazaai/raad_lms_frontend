import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueries,
  useSuspenseQuery,
  QueryKey,
  useQueryClient,
} from "@tanstack/react-query";
import { ApisauceConfig } from "apisauce";
import { callApi } from "@/services";
import { ObjectAny, ApiResponse } from "@/types";
import { useRef } from "react";

/**
 * Configuration for useQueryApi hook
 */
interface QueryApiConfig<TData> extends Partial<ApisauceConfig> {
  queryKey: QueryKey;
  hasFiles?: boolean;
  options?: Omit<UseQueryOptions<ApiResponse<TData>>, "queryKey" | "queryFn">;
}

/**
 * Configuration for useMutationApi hook
 */
interface MutationApiConfig<TData, TVariables> extends Partial<ApisauceConfig> {
  mutationKey?: QueryKey;
  hasFiles?: boolean;
  invalidateKeys?: QueryKey[];
  options?: Omit<UseMutationOptions<ApiResponse<TData>, Error, TVariables>, "mutationFn">;
}

/**
 * useQueryApi Hook
 *
 * Wrapper around React Query's useQuery with:
 * - Automatic request cancellation
 * - Integrated with callApi for Sanctum support
 * - Full TypeScript support
 *
 * @example
 * const { data, isLoading } = useQueryApi<User[]>({
 *   queryKey: ['users'],
 *   url: '/users',
 * });
 */
export function useQueryApi<TData = ObjectAny>({
  queryKey,
  options = {},
  hasFiles = false,
  ...apiConfig
}: QueryApiConfig<TData>) {
  const controllerRef = useRef<AbortController | null>(null);

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Cancel previous request if still pending
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await callApi<TData>({
        ...apiConfig,
        hasFiles,
        signal: controller.signal,
        shouldPopError: false,
      });

      if (!response.ok) {
        throw new Error(response.data?.message || "Request failed");
      }

      return response.data as ApiResponse<TData>;
    },
    ...options,
  });
}

/**
 * useMutationApi Hook
 *
 * Wrapper around React Query's useMutation with:
 * - Integrated with callApi for Sanctum support
 * - Automatic query invalidation
 * - Full TypeScript support
 *
 * @example
 * const { mutate, isPending } = useMutationApi<User, CreateUserDto>({
 *   url: '/users',
 *   method: 'POST',
 *   invalidateKeys: [['users']],
 * });
 */
export function useMutationApi<TData = ObjectAny, TVariables = ObjectAny>({
  mutationKey,
  options = {},
  hasFiles = false,
  invalidateKeys = [],
  ...apiConfig
}: MutationApiConfig<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey,
    mutationFn: async (variables: TVariables) => {
      const response = await callApi<TData>({
        ...apiConfig,
        data: variables,
        hasFiles,
      });

      if (!response.ok) {
        throw new Error(response.data?.message || "Request failed");
      }

      return response.data as ApiResponse<TData>;
    },
    onSuccess: () => {
      // Invalidate specified queries after successful mutation
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
    ...options,
  });
}

/**
 * Configuration for multiple parallel queries
 */
type MultiQueryApiConfigItem<TData> = {
  queryKey: QueryKey;
  options?: UseQueryOptions<ApiResponse<TData>>;
  hasFiles?: boolean;
} & Omit<QueryApiConfig<TData>, "queryKey" | "hasFiles">;

/**
 * useMultiQueryApi Hook
 *
 * Execute multiple queries in parallel
 *
 * @example
 * const results = useMultiQueryApi([
 *   { queryKey: ['users'], url: '/users' },
 *   { queryKey: ['roles'], url: '/roles' },
 * ]);
 */
export function useMultiQueryApi<TData = ObjectAny>(configs: MultiQueryApiConfigItem<TData>[]) {
  return useQueries({
    queries: configs.map(({ queryKey, options = {}, hasFiles = false, ...apiConfig }) => ({
      queryKey,
      queryFn: async () => {
        const response = await callApi<TData>({
          ...apiConfig,
          hasFiles,
          shouldPopError: false,
        });

        if (!response.ok) {
          throw new Error(response.data?.message || "Request failed");
        }

        return response.data as ApiResponse<TData>;
      },
      ...options,
    })),
  });
}

/**
 * useSuspenseQueryApi Hook
 *
 * Suspense-enabled query hook for use with React Suspense boundaries
 *
 * @example
 * const { data } = useSuspenseQueryApi<User[]>({
 *   queryKey: ['users'],
 *   url: '/users',
 * });
 */
export function useSuspenseQueryApi<TData = ObjectAny>({
  queryKey,
  options = {},
  hasFiles = false,
  ...apiConfig
}: QueryApiConfig<TData>) {
  return useSuspenseQuery({
    queryKey,
    queryFn: async () => {
      const response = await callApi<TData>({
        ...apiConfig,
        hasFiles,
        shouldPopError: false,
      });

      if (!response.ok) {
        throw new Error(response.data?.message || "Request failed");
      }

      return response.data as ApiResponse<TData>;
    },
    ...options,
  });
}
