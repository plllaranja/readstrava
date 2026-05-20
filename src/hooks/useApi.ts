import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useApi() {
  const { accessToken, refreshToken } = useAuth();

  const request = useCallback(
    async (input: string, init?: RequestInit): Promise<Response> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string>),
      };

      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      let res = await fetch(input, { ...init, headers });

      if (res.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          res = await fetch(input, { ...init, headers });
        }
      }

      return res;
    },
    [accessToken, refreshToken]
  );

  return { request };
}
