import { useCallback, useState } from "react";
import { ApisauceConfig } from "apisauce";
import { callApi } from "@/services";
import { ObjectAny } from "@/types";

/**
 * useApi Hook
 *
 * Simple imperative API hook for one-off requests
 * Use this when you need manual control over when requests are made
 *
 * @example
 * const { request, loading, data, error } = useApi<User>();
 *
 * const handleSubmit = async () => {
 *   const response = await request({ url: '/users', method: 'POST', data: { name: 'John' } });
 *   if (response?.ok) {
 *     // Handle success
 *   }
 * };
 */
const useApi = <T = ObjectAny>() => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const request = useCallback(async (props: Partial<ApisauceConfig>) => {
    setError(null);
    setLoading(true);

    try {
      const response = await callApi<T>({
        ...props,
      });

      setLoading(false);

      if (!response?.ok) {
        const errorMessage = response?.data?.message || "Request failed";
        setError(errorMessage);
        return response;
      }

      setError(null);
      setData(response.data?.data as T);

      return response;
    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    request,
    loading,
    error,
    data,
    setData,
    reset,
  };
};

export default useApi;
