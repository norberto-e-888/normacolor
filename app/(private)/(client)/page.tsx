/* import { createClient } from "redis";
import { neshCache } from "@neshca/cache-handler/functions";

type Query = Record<string, unknown>;

const redis = createClient();
const createPSK = (resource: string, query: Query) =>
  `${resource}:${JSON.stringify(query)}`;

const cachedGetData = neshCache(
  async (query: Query) => {
    console.log(
      { query },
      "In the real implementation we would use the query object in out db querying logic"
    );

    const documents = await (async () => [{ id: 1 }, { id: 2 }])();
    await Promise.all(
      documents.map(({ id }) =>
        redis.sAdd(`IQI:posts:${id}`, createPSK("posts", query))
      )
    );

    return documents;
  },
  {
    argumentsSerializer: ([query]) => `posts:${JSON.stringify(query)}`,
    revalidate: 1000 * 60 * 30,
  }
);

const handleFetchDocument = async (query: Query) => {
  const psk = `posts:${JSON.stringify(query)}`;
  const data = await cachedGetData(
    {
      tags: ["posts", psk],
    },
    query
  );

  return data;
};
 */
export default async function ClientHomePage() {
  /*   const data = await handleFetchDocument({
    filters: {
      category: "someCategory",
    },
    pagination: {
      page: 1,
      size: 10,
    },
    sort: {
      by: "createdAt",
      order: "desc",
    },
  }); */

  return <main>Client home page{/*  {JSON.stringify(data)} */}</main>;
}
