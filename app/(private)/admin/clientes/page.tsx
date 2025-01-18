"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { useIntersectionObserver } from "usehooks-ts";
import { useDebouncedCallback } from "use-debounce";

import { ClientsResponse } from "@/app/api/clients/route";
import { ClientDetail } from "@/components/smart/client-detail";
import { ClientsTable } from "@/components/smart/clients-table";
import { Content } from "@/components/ui/content";
import { Input } from "@/components/ui/input";
import { User } from "@/database";

export default function AdminClientsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef as never);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
  }, 300);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<ClientsResponse>({
    queryKey: ["admin-clients", searchTerm],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam as string);
      if (searchTerm) params.set("searchTerm", searchTerm);
      const response = await fetch(`/api/clients?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data: ClientsResponse = await response.json();
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  // Separate query for selected client
  const { data: selectedClientData } = useQuery({
    queryKey: ["admin-client", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const response = await fetch(`/api/clients?selectedId=${selectedId}`);
      if (!response.ok) throw new Error("Failed to fetch selected client");
      const data: ClientsResponse = await response.json();
      return data.selectedClient;
    },
    enabled: !!selectedId,
  });

  // Handle infinite scroll
  if (isIntersecting && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const handleClientSelect = (client: User) => {
    setSelectedId(client.id);
  };

  const clients = data?.pages.flatMap((page) => page.clients) ?? [];

  return (
    <Content title="Clientes">
      <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-4">
        <div className="w-full md:w-1/2 lg:w-2/3 overflow-hidden flex flex-col">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por email o nombre..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg relative">
            <ClientsTable
              clients={clients}
              selectedClientId={selectedId || undefined}
              onClientSelect={handleClientSelect}
              onClientUpdate={refetch}
            />
            {(isLoading || isFetchingNextPage) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
            <div ref={loadMoreRef} className="h-4" />
          </div>
        </div>

        <div className="hidden md:block w-1/2 lg:w-1/3 overflow-y-auto">
          <ClientDetail client={selectedClientData || null} />
        </div>
      </div>
    </Content>
  );
}
