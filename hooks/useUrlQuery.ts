import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Query {
  filter: {
    a: number;
    b: number;
    c: number;
  };
  pagination: {
    page: number;
    size: number;
  };
  sort: {
    by: string;
    direction: string;
  };
}

const DEFAULT_QUERY: Query = {
  filter: { a: 1, b: 2, c: 3 },
  pagination: { page: 1, size: 10 },
  sort: { by: "createdAt", direction: "desc" },
};

function parseSearchParams(params: URLSearchParams): Query {
  return {
    filter: {
      a: parseInt(params.get("filter.a") || DEFAULT_QUERY.filter.a.toString()),
      b: parseInt(params.get("filter.b") || DEFAULT_QUERY.filter.b.toString()),
      c: parseInt(params.get("filter.c") || DEFAULT_QUERY.filter.c.toString()),
    },
    pagination: {
      page: parseInt(
        params.get("page") || DEFAULT_QUERY.pagination.page.toString()
      ),
      size: parseInt(
        params.get("size") || DEFAULT_QUERY.pagination.size.toString()
      ),
    },
    sort: {
      by: params.get("sort.by") || DEFAULT_QUERY.sort.by,
      direction: params.get("sort.direction") || DEFAULT_QUERY.sort.direction,
    },
  };
}

function stringifyQuery(query: Query): string {
  const params = new URLSearchParams();
  params.set("filter.a", query.filter.a.toString());
  params.set("filter.b", query.filter.b.toString());
  params.set("filter.c", query.filter.c.toString());
  params.set("page", query.pagination.page.toString());
  params.set("size", query.pagination.size.toString());
  params.set("sort.by", query.sort.by);
  params.set("sort.direction", query.sort.direction);
  return params.toString();
}

export function useUrlQuery(initialQuery?: Partial<Query>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, _setQuery] = useState<Query>(() => {
    const parsedQuery = parseSearchParams(searchParams);
    return { ...DEFAULT_QUERY, ...parsedQuery, ...initialQuery };
  });

  useEffect(() => {
    const queryString = stringifyQuery(query);
    router.push(`?${queryString}`, { scroll: false });
  }, [query, router]);

  const setQuery = useCallback((newQuery: Partial<Query>) => {
    _setQuery((prevQuery) => ({
      ...prevQuery,
      ...newQuery,
    }));
  }, []);

  return [query, setQuery];
}
