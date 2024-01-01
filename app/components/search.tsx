"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MediaItem } from "@/lib/get-tweet";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { saveAs } from "file-saver";

import * as z from "zod";

const formSchema = z.object({
  url: z.string().url(),
});

export const Search = () => {
  const [result, setResult] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await axios.post("/api/twitter", { url: values.url });
      const parse_res = parseMediaItems(res.data);
      setResult(parse_res);
    } catch (e) {
      console.log(e);
      setError((e ?? "").toString());
    }
    console.log(values);
  }

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

  const downloadImage = (url: string, type: string) => {
    if (type == "video" || /video/.test(type)) {
      saveAs(url, "video.mp4");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 md:px-10 md:py-10 lg:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-4 text-center text-4xl font-semibold md:text-4xl">
          Twitter動画保存
        </h1>
        <p className="text-sm text-center">
          &ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;
          Twitterの動画を簡単に保存できるサービスです。
          &ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        {result.length == 0 ? (
          <div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-row mt-5 mx-auto">
                          <Input
                            className="flex mr-1"
                            placeholder="ここにURLをペースト"
                            {...field}
                          />
                          <Button
                            type="submit"
                            className="flex items-center justify-center bg-blue-500 text-white"
                          >
                            動画保存
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        ) : (
          <div></div>
        )}
      </div>
      <div className="mx-auto w-full max-w-3xl">
        {!(result.length > 0) || (error != "" && typeof error == "string") ? (
          <div>
            <span className="text-yellow-700 dark:text-orange-300">
              <p>{error}</p>
            </span>
          </div>
        ) : (
          <div className="flex mt-10 justify-center">
            {result.map(({ type, variants }) => {
              // 直接在这里声明 variant 常量
              const variant = variants[0];

              if (variant.url && type && variant.url.length > 0) {
                if (type == "video" || /video/.test(variant.mimeType)) {
                  console.log(variant.quality);
                  return (
                    <Button
                      type="button"
                      className="flex items-center text-center justify-center bg-blue-500 text-white"
                      onClick={() => downloadImage(variant.url, type)}
                    >
                      動画保存({variant.quality})
                    </Button>
                  );
                } else {
                  return <div>image</div>;
                }
              } else {
                console.log("Error: ", variant);
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};
