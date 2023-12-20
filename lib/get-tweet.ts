import { ImageValue, TwitterCard, UnifiedCardData } from "@/types/card";
import type { MediaDetails, MediaEntity } from "@/types/index";

export const EMBED_API_URL = "https://cdn.syndication.twimg.com";

/*
 * Custom error class for handing Twitter API errors.
 */
export class TwitterApiError extends Error {
  status: number;
  data: any;

  constructor({
    message,
    status,
    data,
  }: {
    message: string;
    status: number;
    data: any;
  }) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/*
 * Represents an item of media associated with a tweet, such as a photo or video.
 */
export interface MediaItem {
  type: string; // Type of the media item (e.g., photo, video)
  variants: MediaVariant[]; // Different variants of the media item
}

/*
 * Represents a variant of media included in a tweet, with details like URL and quality.
 * Think of a variant as a version of media,
 * e.g. the various qualties of videos,
 * e.g. a video variant of 360p and 720p, etc...
 */
export interface MediaVariant {
  url: string;
  quality: string; // Quality of the media item (e.g., 360p, 720p)
  aspectRatio: string; // Aspect ratio, important for display purposes
  mimeType: string; // MIME type, useful for rendering decisions
  fileSizeInBytes?: number; // Optional file size in bytes
  altText?: string; // Optional alt text for accessibility
}

/*
 * Approximates the resolution quality of a video based on its bitrate.
 * Higher bitrates generally indicate higher video quality.
 * @param bitrate - The bitrate of the video in bits per second.
 * @returns A string representing the approximated resolution (e.g., '720p', '1080p').
 */
export function approximateResolution(bitrate: number): string {
  // Resolution is approximated based on common bitrate thresholds
  // Add more thresholds if needed to handle different resolutions
  if (bitrate > 5000000) {
    return "1080p";
  } else if (bitrate > 2000000) {
    return "720p";
  } else if (bitrate > 1000000) {
    return "480p";
  } else if (bitrate > 500000) {
    return "360p";
  } else {
    return "240p";
  }
}

/*
 * Sorts media variants based on the type of media.
 * For photos, sorts by aspect ratio; for videos and GIFs, sorts by quality.
 * @param variants - Array of media variants to be sorted.
 * @param type - The type of media (photo, video, animated_gif).
 * @returns Sorted array of media variants.
 */
export const sortVariants = (
  variants: MediaVariant[],
  type: "photo" | "video" | "animated_gif" | (string & {})
): MediaVariant[] => {
  // Sorting logic differs based on the media type
  // For example, photos might be sorted by aspect ratio for optimal display
  // Videos and GIFs are sorted by quality for best viewing experience
  switch (type) {
    case "photo":
      // Sort by aspect ratio
      return variants.sort((a, b) => {
        const ratioA = aspectRatioToFloat(a.aspectRatio);
        const ratioB = aspectRatioToFloat(b.aspectRatio);
        return ratioB - ratioA;
      });
    case "video":
    case "animated_gif":
      // Sort by quality (high to low)
      return variants.sort(
        (a, b) => qualityToNumber(b.quality) - qualityToNumber(a.quality)
      );
    default:
      return variants;
  }
};

// Utility functions for internal calculations
// aspectRatioToFloat and qualityToNumber help in sorting and comparing media variants
// Converts aspect ratio string to a float for comparison
export const aspectRatioToFloat = (aspectRatio: string): number => {
  const [width, height] = aspectRatio.split(":").map(Number);
  return width / height;
};

// Converts quality string to a number for comparison
export const qualityToNumber = (quality: string): number => {
  const match = quality.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

/*
 * Processes and extracts media variants from a given MediaDetails object.
 * This function handles different types of media (photo, video, animated_gif)
 * and extracts relevant information for each type.
 * @param media - The MediaDetails object containing media information.
 * @returns Array of extracted media variants.
 */
const extratVariants = (media: MediaDetails) => {
  // The function handles different media types distinctly
  // For photos, it extracts JPEG format data
  // For videos and GIFs, it processes each variant and sorts them
  const variants: MediaVariant[] = [];
  switch (media.type) {
    case "photo":
      // For photos, we assume a JPEG format; adjust as needed
      variants.push({
        url: media.media_url_https,
        quality: "original",
        aspectRatio: `${media.original_info.width}:${media.original_info.height}`,
        mimeType: "image/jpeg",
        altText: media.ext_alt_text,
      });
      break;
    case "video":
    case "animated_gif":
      // For videos and animated GIFs, sort and process each variant
      media.video_info.variants
        .filter((variant) => variant.content_type === "video/mp4")
        .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))
        .forEach((variant) => {
          variants.push({
            url: variant.url,
            quality: approximateResolution(variant.bitrate ?? 0),
            aspectRatio: media.video_info.aspect_ratio.join(":"),
            mimeType: variant.content_type,
            // Note: File size is not provided by the API
          });
        });
      break;
  }

  return sortVariants(variants, media.type);
};

/*
 * Extracts media items from a Twitter card object.
 * Cards are used for non-conventional features of a tweet, like carousel ads or YouTube embeds.
 * The function handles different types of cards, including default embeds and unified cards.
 * @param card - The TwitterCard object containing card information.
 * @returns Array of MediaItem objects extracted from the card.
 */
const extractCardMedia = (card: TwitterCard) => {
  // The function parses and extracts media from different card types
  // It handles unified cards that contain a carousel of items
  // Each media item is processed and added to the result
  const additionItems: MediaItem[] = [];
  const cards = card.binding_values;
  for (const key in cards) {
    const value = cards?.[key];
    if (value && value?.image_value) {
      const image: ImageValue = value.image_value;
      const index = additionItems.length;
      if (additionItems.length <= 0) {
        additionItems.push({ type: "photo", variants: [] });
      }

      additionItems?.[index]?.variants.push({
        url: image.url,
        quality: "original", // Twitter cards do not provide different qualities
        aspectRatio: `${image.width}:${image.height}`,
        mimeType: "image/jpeg", // Assuming JPEG; adjust as needed
        // altText and fileSizeInBytes are not provided in the card
      });
    }

    if (key === "unified_card" && value && value?.string_value) {
      // Attempt to parse the unified_card data from the card's binding_values
      const unifiedCard = value;
      try {
        // Parsing the stringified JSON data of the unified_card
        const unifiedCardData: UnifiedCardData = JSON.parse(
          unifiedCard?.string_value!
        );

        // Extracting media_entities from the unified_card
        // These entities provide a mapping from media IDs to media details
        const mediaEntities = unifiedCardData?.media_entities ?? {};
        const componentObjects = unifiedCardData?.component_objects ?? {};

        // Iterating over component objects to extract media references
        Array.from(Object.entries(componentObjects) ?? [])?.forEach(
          ([, component]) => {
            if (
              component.type === "media" &&
              component.data &&
              component.data.id
            ) {
              // Finding the media details using the media ID in the component data
              const mediaId = component.data.id;
              const media = mediaEntities[mediaId] as unknown as MediaDetails &
                MediaEntity;
              if (media) {
                additionItems.push({
                  type: media.type,
                  variants: extratVariants(media),
                });
              }
            }
          }
        );
      } catch (error) {
        console.error("Error parsing unified card data:", error);
      }
    }
  }
};
