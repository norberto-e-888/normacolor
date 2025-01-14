"use server";

import { SessionUser } from "@/auth";

import { getServerSession } from "../auth";

export const downloadArt = async (id: number): Promise<{ url: string }> => {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if ((session.user as SessionUser)?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const options: RequestInit = {
    method: "GET",
    headers: { "x-freepik-api-key": process.env.FREEPIK_API_KEY as string },
    mode: "no-cors",
  };

  const response = await fetch(
    `https://api.freepik.com/v1/resources/${id}/download`,
    options
  );

  const json = await response.json();

  return {
    url: json.data.url,
  };
};
