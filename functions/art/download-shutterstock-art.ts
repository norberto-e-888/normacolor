"use server";

export const downloadShutterstockArt = async (
  id: string
): Promise<{ url: string }> => {
  const response = await fetch(
    `https://api.shutterstock.com/v2/images/${id}/download?format=psd`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SHUTTERSTOCK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get Shutterstock download URL");
  }

  const data = await response.json();
  return { url: data.url };
};
