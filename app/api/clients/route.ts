import { NextResponse } from "next/server";

import { User, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== UserRole.Admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const selectedId = searchParams.get("selectedId");
  const searchTerm = searchParams.get("searchTerm");

  await connectToMongo();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: any[] = [
    {
      $match: {
        role: UserRole.Client,
      },
    },
  ];

  // Add search stage if search term is provided
  if (searchTerm?.trim()) {
    pipeline.unshift({
      $search: {
        index: "users_name_email",
        compound: {
          should: [
            {
              autocomplete: {
                query: searchTerm,
                path: "email",
                fuzzy: {
                  maxEdits: 1,
                },
              },
            },
            {
              autocomplete: {
                query: searchTerm,
                path: "name",
                fuzzy: {
                  maxEdits: 1,
                },
              },
            },
          ],
        },
      },
    });
  }

  // Add cursor-based pagination
  if (cursor) {
    pipeline.push({
      $match: {
        createdAt: { $lt: new Date(cursor) },
      },
    });
  }

  // Add sorting and limit
  pipeline.push({ $sort: { createdAt: -1 } }, { $limit: PAGE_SIZE + 1 });

  const clients = await User.aggregate(pipeline).then((docs) =>
    docs.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
    }))
  );

  const hasMore = clients.length > PAGE_SIZE;
  if (hasMore) {
    clients.pop();
  }

  const nextCursor = hasMore
    ? clients[clients.length - 1].createdAt.toISOString()
    : null;

  let selectedClient = null;
  if (selectedId) {
    selectedClient = await User.findOne({
      _id: selectedId,
      role: UserRole.Client,
    })
      .lean()
      .then((doc) =>
        doc
          ? {
              ...doc,
              id: doc._id.toString(),
              _id: undefined,
            }
          : null
      );
  }

  return NextResponse.json({
    clients,
    nextCursor,
    selectedClient,
  });
}

export type ClientsResponse = {
  clients: User[];
  nextCursor: string | null;
  selectedClient: User | null;
};
