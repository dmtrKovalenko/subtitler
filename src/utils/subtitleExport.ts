export interface SubtitleCue {
  id?: number;
  text: string;
  timestamp: [number, number | null];
  isInProgress?: boolean;
}

async function saveFile(
  content: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  if ("showSaveFilePicker" in window) {
    const fileExtension = `.${filename.split(".").pop() || ""}` as const;
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: `${fileExtension.toUpperCase()} File`,
          accept: { [mimeType as `${string}/${string}`]: [fileExtension] },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } else {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Formats seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${milliseconds
    .toString()
    .padStart(3, "0")}`;
}

/** Formats seconds to VTT time format (HH:MM:SS.mmm) */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")}`;
}

/** Converts subtitle cues to SRT format and downloads the file */
export async function exportToSRT(
  subtitles: SubtitleCue[],
  filename: string = "subtitles",
): Promise<void> {
  let srtContent = "";
  let validCueIndex = 1;
  filename = basename(filename);

  for (const subtitle of subtitles) {
    const [startTime, endTime] = subtitle.timestamp;

    // Skip cues without valid end time or empty text
    if (!endTime || !subtitle.text.trim()) {
      continue;
    }

    srtContent += `${validCueIndex}\n`;
    srtContent += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
    srtContent += `${subtitle.text.trim()}\n\n`;

    validCueIndex++;
  }

  await saveFile(srtContent, `${filename}.srt`, "text/plain");
}

let VTT_SLUG = "WEBVTT\n\n";

/** Converts subtitle cues to WebVTT format and downloads the file */
export async function exportToVTT(
  subtitles: SubtitleCue[],
  filename: string = "subtitles",
): Promise<void> {
  filename = basename(filename);

  for (const subtitle of subtitles) {
    const [startTime, endTime] = subtitle.timestamp;

    // Skip cues without valid end time or empty text
    if (!endTime || !subtitle.text.trim()) {
      continue;
    }

    VTT_SLUG += `${formatVTTTime(startTime)} --> ${formatVTTTime(endTime)}\n`;
    VTT_SLUG += `${subtitle.text.trim()}\n\n`;
  }

  await saveFile(VTT_SLUG, `${filename}.vtt`, "text/vtt");
}

function basename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

