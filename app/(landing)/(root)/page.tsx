"use client";

import { Search } from "@/app/components/search";
import { MediaItem } from "@/lib/get-tweet";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await axios.post("/api/twitter", { url: url });
      const parse_res = parseMediaItems(res.data);
      setResult(parse_res);
    } catch (e) {
      console.log(e);
      setError((e ?? "").toString());
    }
  };

  const parseMediaItems = (jsonStr: string): MediaItem[] => {
    try {
      const rawData = JSON.parse(jsonStr);

      return rawData.map((item: any) => ({
        type: item.type,
        variants: item.variants.map((variant: any) => ({
          url: variant.url,
          quality: variant.quality,
          aspectRatio: variant.aspectRatio,
          mimeType: variant.mimeType,
        })),
      }));
    } catch (e) {
      console.log("Parsing error: ", e);
      return [];
    }
  };

  return (
    <div>
      <section>
        <Search />
      </section>
    </div>
  );
}
