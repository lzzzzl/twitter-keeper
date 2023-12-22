import {
  Attributes,
  ParseLine,
  Playlist,
  PlaylistHeader,
  PlaylistItem,
} from "@/lib/m3u8/types";

export class M3U8Parser {
  public rawPlaylist = "";
  public filteredMap: Map<string, Playlist> = new Map();

  public items: Map<number, PlaylistItem> = new Map();
  public header: PlaylistHeader = {} as PlaylistHeader;
  public groups: Set<string> = new Set();

  constructor({ playlist, url }: { playlist?: string; url?: string }) {
    if (playlist) {
      this.rawPlaylist = playlist;
      this.parse(playlist);
    }

    if (url) {
      this.fetchPlaylist({ url });
    }
  }

  parseLine(line: string, index: number): ParseLine {
    return {
      index,
      raw: line,
    };
  }

  parseHeader(line: string) {
    const supportedAttrs = [Attributes.X_TVG_URL, Attributes.URL_TVG];
    const attrs = new Map();

    for (const attrName of supportedAttrs) {
      const tvgUrl = this.getAttribute(attrName, line);
      if (tvgUrl) {
        attrs.set(attrName, tvgUrl);
      }
    }

    this.header = {
      attrs: Object.fromEntries(attrs.entries()),
      raw: line,
    };
  }

  private getAttribute(name: Attributes, line: string) {
    const regex = new RegExp(name + '="(.*?)"', "gi");
    const match = regex.exec(line);

    return (match && match[1] ? match[1] : "")?.trimStart()?.trimEnd();
  }

  private parse(raw: string): void {
    let i = 0;
    const lines = raw.split("\n").map(this.parseLine);
    const firstLine = lines.find((l) => l.index === 0);

    if (!firstLine || !/^#EXTM3U/.test(firstLine.raw)) {
      throw new Error("Playlist is not valid");
    }

    this.parseHeader(firstLine?.raw);

    for (const line of lines) {
      if (line.index === 0) continue;
      const string = line.raw.toString().trim();

      if (string.startsWith("#EXTINF:")) {
        
      }
    }
  }
}
