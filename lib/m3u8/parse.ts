import {
  Attributes,
  ParseLine,
  type Playlist,
  PlaylistHeader,
  PlaylistItem,
  PlaylistItemValidator,
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

  private getPlaylistItems(group: string): PlaylistItem[] {
    return Array.from(this.items.values()).filter((item) => {
      item?.group?.title?.toLowerCase().startsWith(group.toLowerCase());
    });
  }

  public getPlaylistsByGroups(groups: string[]): Playlist {
    const key = groups.join("-");
    const cached = this.filteredMap.get(key);

    if (cached) {
      return cached;
    }

    const items = groups.reduce((acc: PlaylistItem[], group: string) => {
      const playlistItems = this.getPlaylistItems(group);

      return [...acc, ...playlistItems];
    }, []);

    const playlist = {
      header: this.header,
      items,
    };

    this.filteredMap.set(key, playlist);

    return playlist;
  }

  public updatePlaylist(playlist: Playlist) {
    const items = new Map();
    let i = 0;

    if (playlist.items) {
      playlist.items.forEach((item) => {
        items.set(i, PlaylistItemValidator.parse(item));
        i++;
      });
    }

    this.items = items;
  }

  public get playlistGroups(): string[] {
    return Array.from(this.groups);
  }

  public async fetchPlaylist({ url }: { url: string }) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status}`);
    }

    const playlist = await response.text();
    this.rawPlaylist = playlist;
    this.parse(playlist);
  }

  public filterPlaylist(filters?: string[]) {
    const groupsToFilter = filters
      ?.map((filter) =>
        this.playlistGroups.filter((p) =>
          p.toLowerCase().startsWith(filter.toLowerCase())
        )
      )
      .flat();

    if (groupsToFilter) {
      const filteredItems = this.getPlaylistsByGroups(groupsToFilter);
      this.updatePlaylist(filteredItems);
    }
  }
}
