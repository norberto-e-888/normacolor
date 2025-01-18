"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selectedId");
  const [searchTerm, setSearchTerm] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef as never);
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("searchTerm", value);
    } else {
      params.delete("searchTerm");
    }

    params.delete("cursor"); // Reset pagination when searching
    router.replace(`/admin/clientes?${params.toString()}`, { scroll: false });
  }, 300);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<ClientsResponse>({
    queryKey: ["admin-clients", searchParams.get("searchTerm")],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (pageParam) params.set("cursor", pageParam as string);
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
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedId", client.id);
    router.replace(`/admin/clientes?${params.toString()}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <Content>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Content>
    );
  }

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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg">
            <ClientsTable
              clients={clients}
              selectedClientId={selectedId || undefined}
              onClientSelect={handleClientSelect}
              onClientUpdate={refetch}
            />
            <div ref={loadMoreRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block w-1/2 lg:w-1/3 overflow-y-auto">
          <ClientDetail client={selectedClientData || null} />
        </div>
      </div>
    </Content>
  );
}
