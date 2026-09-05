import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useOfficers() {
  return useQuery({
    queryKey: [api.officers.list.path],
    queryFn: async () => {
      const res = await fetch(api.officers.list.path);
      if (!res.ok) throw new Error("Failed to fetch officers");
      return api.officers.list.responses[200].parse(await res.json());
    },
  });
}
