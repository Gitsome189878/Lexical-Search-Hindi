import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Hook for searching words
export function useSearchWords(query: string) {
  return useQuery({
    queryKey: [api.words.search.path, query],
    queryFn: async () => {
      if (!query.trim()) return null;
      
      const url = `${api.words.search.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) throw new Error("Failed to fetch search results");
      
      const data = await res.json();
      return api.words.search.responses[200].parse(data);
    },
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Hook for getting full details of a specific word
export function useWordDetails(id: number | null) {
  return useQuery({
    queryKey: [api.words.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      
      const url = buildUrl(api.words.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch word details");
      
      const data = await res.json();
      return api.words.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

// Hook for "Word of the Day" or initial list (optional usage)
export function useWordsList() {
  return useQuery({
    queryKey: [api.words.list.path],
    queryFn: async () => {
      const res = await fetch(api.words.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch words list");
      return api.words.list.responses[200].parse(await res.json());
    },
  });
}
