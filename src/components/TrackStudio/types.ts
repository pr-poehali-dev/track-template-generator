export interface Track {
  id: string;
  name: string;
  cover: string;
  audio: string;
  lyrics: string;
  duration: string;
}

export interface CoverImage {
  id: string;
  url: string;
  file: File;
}
