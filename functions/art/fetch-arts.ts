"use server";

export type Art = {
  id: number;
  title: string;
  active: boolean;
  url: string;
  filename: string;
  image: {
    type: "vector" | "photo";
    orientation: string;
    source: {
      url: string;
      key: string;
      size: string;
    };
  };
};

export const fetchArts = async ({
  term = "",
}: { term?: string } = {}): Promise<{
  arts: Art[];
}> => {
  const options: RequestInit = {
    method: "GET",
    headers: { "x-freepik-api-key": process.env.FREEPIK_API_KEY as string },
  };

  const params = {
    term,
    "filters[content_type][psd]": "1",
    "filters[license][premium]": "1",
  };

  const response = await fetch(
    `https://api.freepik.com/v1/resources?${new URLSearchParams(
      params
    ).toString()}`,
    options
  );

  const json = await response.json();

  console.log({ data: json.data });

  return {
    arts: json.data,
  };
};
