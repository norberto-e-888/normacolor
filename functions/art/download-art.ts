"use server";

export const downloadArt = async (id: number): Promise<{ url: string }> => {
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
