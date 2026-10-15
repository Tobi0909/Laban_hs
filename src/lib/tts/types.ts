export interface TtsResult {
  audio: Buffer;
  contentType: string;
  extension: string;
}

export interface TtsProvider {
  synthesize(text: string): Promise<TtsResult>;
}
