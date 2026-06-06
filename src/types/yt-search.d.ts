declare module "yt-search" {
  interface VideoResult {
    videoId: string;
    title: string;
    seconds: number;
  }

  interface SearchResult {
    videos: VideoResult[];
  }

  function ytSearch(query: string): Promise<SearchResult>;
  export = ytSearch;
}
