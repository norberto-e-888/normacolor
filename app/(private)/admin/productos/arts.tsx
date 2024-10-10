"use client";

import Image from "next/image";

import { Art, downloadArt } from "@/functions/art";

export function Arts({ arts }: { arts: Art[] }) {
  return arts.map((art) => {
    const [x, y] = art.image.source.size.split("x").map(Number);

    return (
      <div key={art.id}>
        <Image
          className="cursor-pointer"
          src={art.image.source.url}
          width={x * 0.8}
          height={y * 0.8}
          alt={art.title}
          onClick={async (e) => {
            e.preventDefault();
            const { url } = await downloadArt(art.id);
            console.log({ downloadUrl: url });
          }}
        />
      </div>
    );
  });
}
