"use client";

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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form onSubmit={handleSubmit}>
        <div className="relative z-0 w-full mb-6 group">
          <input
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            // type="number"
            min="0"
            max="1000"
            required
            id="number"
            placeholder="URL"
            value={url}
            onChange={handleInputChange}
          />
        </div>
        <div className="flex justify-center items-center mb-10">
          <button
            type="submit"
            className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
          >
            Click
          </button>
        </div>
        <div className="flex justify-center items-center">
          {!(result.length > 0) || (error != "" && typeof error == "string") ? (
            <span className="text-yellow-700 dark:text-orange-300">
              <p>{error}</p>
            </span>
          ) : (
            <div className="w-full flex flex-col gap-[inherit]">
              {
                // 假设 results 是你要遍历的数组
                result.map(({ type, variants }) => {
                  // 直接在这里声明 variant 常量
                  const variant = variants[0];

                  if (variant.url && type && variant.url.length > 0) {
                    if (type == "video" || /video/.test(variant.mimeType)) {
                      console.log("video: ", variant);
                      return (
                        <video
                          key={type}
                          src={variant.url}
                          controls
                          className="w-full bg-black object-cover"
                        />
                      );
                    } else {
                      console.log("image: ", variant);
                      return (
                        <div>
                          <Image
                            alt="image"
                            key={type}
                            src={variant.url}
                            className="w-full object-cover"
                            width={500}
                            height={500}
                          />
                        </div>
                      );
                    }
                  } else {
                    console.log("Error: ", variant);
                  }
                })
              }
            </div>
          )}
        </div>
      </form>
    </main>
  );
}
