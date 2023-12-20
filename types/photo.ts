import type { Rect, RGB } from '@/types/media.js'

export interface TweetPhoto {
  backgroundColor: RGB
  cropCandidates: Rect[]
  expandedUrl: string
  url: string
  width: number
  height: number
}