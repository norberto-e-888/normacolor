/* import { neshCache } from "@neshca/cache-handler/functions";

type Query = Record<string, unknown>;

const getData = neshCache(
  async (query: Query) => {
    console.log(
      { query },
      "In the real implementation we would use the query object in out db querying logic"
    );

    return ["test data"];
  },
  {
    argumentsSerializer: ([query]) => `posts:${JSON.stringify(query)}`,
    revalidate: 1000 * 60 * 30,
  }
);

const fetch = async (query: Query) => {
  const psk = `posts:${JSON.stringify(query)}`;
  const data = await getData(
    {
      tags: ["posts", psk],
    },
    query
  );

  return data;
};
 */
export default async function ClientHomePage() {
  /*   const data = await fetch({
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
