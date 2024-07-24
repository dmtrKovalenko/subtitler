/// <reference types="./mp4box.d.ts" />
import MP4Box, {
  DataStream,
  ISOFile,
  MP4ArrayBuffer,
  MP4AudioTrack,
  MP4Info,
  MP4MediaTrack,
  MP4Sample,
  MP4VideoTrack,
} from "mp4box";

// Wraps an MP4Box File as a WritableStream underlying sink.
class MP4FileSink {
  #setStatus: (status: string, message: string) => void;
  #file: ISOFile;
  #offset = 0;

  constructor(
    file: ISOFile,
    setStatus: (status: string, message: string) => void,
  ) {
    this.#file = file;
    this.#setStatus = setStatus;
  }

  write(chunk: Uint8Array) {
    // MP4Box.js requires buffers to be ArrayBuffers, but we have a Uint8Array.
    const buffer = new ArrayBuffer(chunk.byteLength) as MP4ArrayBuffer;
    new Uint8Array(buffer).set(chunk);

    // Inform MP4Box where in the file this chunk is from.
    buffer.fileStart = this.#offset;
    this.#offset += buffer.byteLength;

    // Append chunk.
    this.#setStatus("fetch", (this.#offset / 1024 ** 2).toFixed(1) + " MiB");
    this.#file.appendBuffer(buffer);
  }

  close() {
    this.#setStatus("fetch", "Done");
    this.#file.flush();
  }
}

export type Metadata = {
  width: number;
  height: number;
  bitrate: number;
  duration: number;
  timescale: number;
  nbSamples: number;
  totalDuration: number;
};

// Demuxes the first video track of an MP4 file using MP4Box, calling
// `onConfig()` and `onChunk()` with appropriate WebCodecs objects.
export class MP4Demuxer {
  #audioTrack: MP4AudioTrack | undefined;
  #videoTrack: MP4VideoTrack | undefined;
  #onConfig: (
    videoConfig: VideoDecoderConfig,
    audioConfig: AudioDecoderConfig,
    metadata: Metadata,
  ) => void;
  #onVideoChunk: (chunk: EncodedVideoChunk) => void;
  #onRawAudioChunk: (
    data: Uint8Array,
    type: "key" | "delta",
    timestamp: number,
    duration: number,
    meta?: EncodedAudioChunkMetadata,
  ) => void;
  #file: ISOFile | null = null;

  constructor(
    file: File,
    {
      onConfig,
      onRawAudioChunk,
      onVideoChunk,
      setStatus,
    }: {
      onConfig: (
        videoConfig: VideoDecoderConfig,
        audioConfig: AudioDecoderConfig,
        metadata: Metadata,
      ) => void;
      onVideoChunk: (chunk: EncodedVideoChunk) => void;
      onRawAudioChunk: (
        data: Uint8Array,
        type: "key" | "delta",
        timestamp: number,
        duration: number,
        meta?: EncodedAudioChunkMetadata,
      ) => void;
      setStatus: (status: string, message?: string) => void;
    },
  ) {
    this.#onConfig = onConfig;
    this.#onVideoChunk = onVideoChunk;
    this.#onRawAudioChunk = onRawAudioChunk;

    // Configure an MP4Box File for demuxing.
    this.#file = MP4Box.createFile();
    this.#file.onError = (error) => setStatus("demux", error);
    this.#file.onReady = this.#onReady.bind(this);
    this.#file.onSamples = this.#onSamples.bind(this);

    // Fetch the file and pipe the data through.
    const fileSink = new MP4FileSink(this.#file, setStatus);

    // highWaterMark should be large enough for smooth streaming, but lower is
    // better for memory usage.
    file.stream().pipeTo(new WritableStream(fileSink, { highWaterMark: 2 }));
  }

  // Get the appropriate `description` for a specific track. Assumes that the
  // track is H.264, H.265, VP8, VP9, or AV1.
  #description(track: MP4MediaTrack) {
    if (!this.#file) {
      return;
    }

    const trak = this.#file.getTrackById(track.id);
    if (!trak.mdia?.minf?.stbl?.stsd) {
      return;
    }
    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (box) {
        const stream = new DataStream(
          new ArrayBuffer(8 + box.byteLength),
          0,
          DataStream.BIG_ENDIAN,
        );
        box.write(stream);
        if (!stream.buffer) {
          throw new Error("Failed to write box to stream");
        }
        return new Uint8Array(stream.buffer, 8); // Remove the box header.
      }
    }
    throw new Error("avcC, hvcC, vpcC, or av1C box not found");
  }

  #onReady(info: MP4Info) {
    this.#videoTrack = info.videoTracks[0];
    this.#audioTrack = info.audioTracks[0];

    // Generate and emit an appropriate VideoDecoderConfig.
    this.#onConfig(
      {
        // Browser doesn't support parsing full vp8 codec (eg: `vp08.00.41.08`),
        // they only support `vp8`.
        codec: this.#videoTrack.codec.startsWith("vp08")
          ? "vp8"
          : this.#videoTrack.codec,
        codedHeight: this.#videoTrack.video.height,
        codedWidth: this.#videoTrack.video.width,
        description: this.#description(this.#videoTrack),
      },
      {
        codec: this.#audioTrack.codec,
        numberOfChannels: this.#audioTrack.audio.channel_count,
        sampleRate: this.#audioTrack.audio.sample_rate,
      },
      {
        totalDuration: info.duration,
        duration: this.#videoTrack.duration,
        timescale: this.#videoTrack.timescale,
        nbSamples: this.#videoTrack.nb_samples,
        bitrate: this.#videoTrack.bitrate,
        width: this.#videoTrack.video.width,
        height: this.#videoTrack.video.height,
      },
    );

    // Start demuxing.
    this.#file?.setExtractionOptions(this.#videoTrack.id);
    this.#file?.setExtractionOptions(this.#audioTrack.id);
    this.#file?.start();
  }

  #videoTimestampToMicroseconds = (value: number, timescale: number) =>
    (1e6 * value) / timescale;

  // Generate and emit an EncodedVideoChunk for each demuxed sample.
  #onSamples(track_id: number, _: unknown, samples: MP4Sample[]) {
    if (track_id === this.#audioTrack?.id) {
      for (const sample of samples) {
        this.#onRawAudioChunk(
          sample.data,
          sample.is_sync ? "key" : "delta",
          this.#videoTimestampToMicroseconds(sample.cts, sample.timescale),
          this.#videoTimestampToMicroseconds(sample.duration, sample.timescale),
        );
      }
    }

    if (track_id === this.#videoTrack?.id) {
      for (const sample of samples) {
        this.#onVideoChunk(
          new EncodedVideoChunk({
            type: sample.is_sync ? "key" : "delta",
            timestamp: this.#videoTimestampToMicroseconds(
              sample.cts,
              sample.timescale,
            ),
            duration: this.#videoTimestampToMicroseconds(
              sample.duration,
              sample.timescale,
            ),
            data: sample.data,
          }),
        );
      }
    }
  }
}
