import { describe, it, expect } from "vitest";
import {
  Mp4OutputFormat,
  CanvasSource,
  getFirstEncodableVideoCodec,
  QUALITY_HIGH,
  type VideoCodec,
} from "mediabunny";
import { loadGoogleFont } from "./subtitle-renderer";

describe("MediaBunny Bitrate Validation", () => {
  it("should test different bitrate values with CanvasSource", async () => {
    const canvas = new OffscreenCanvas(640, 360);

    const format = new Mp4OutputFormat();
    const videoCodec = await getFirstEncodableVideoCodec(
      format.getSupportedVideoCodecs(),
      { width: 640, height: 360 },
    );

    if (!videoCodec) {
      throw new Error("No compatible video codec found");
    }

    console.log("Selected codec:", videoCodec);

    // Note: We don't call close() on sources that aren't connected to an output track
    // as mediabunny throws "Cannot call close without connecting the source to an output track"

    // Test 1: Try with QUALITY_HIGH directly
    console.log("\n=== Test 1: QUALITY_HIGH ===");
    try {
      const source1 = new CanvasSource(canvas, {
        codec: videoCodec as VideoCodec,
        bitrate: QUALITY_HIGH,
      });
      console.log("✓ QUALITY_HIGH works");
      // Don't call close() - source not connected to output
    } catch (e) {
      console.error("✗ QUALITY_HIGH failed:", e);
      throw e;
    }

    // Test 2: Try with integer
    console.log("\n=== Test 2: Integer bitrate (5000000) ===");
    try {
      const source2 = new CanvasSource(canvas, {
        codec: videoCodec as VideoCodec,
        bitrate: 5000000,
      });
      console.log("✓ Integer bitrate works");
      // Don't call close() - source not connected to output
    } catch (e) {
      console.error("✗ Integer bitrate failed:", e);
      throw e;
    }

    // Test 3: Try with float (this might fail)
    console.log("\n=== Test 3: Float bitrate (5000000.5) ===");
    try {
      const source3 = new CanvasSource(canvas, {
        codec: videoCodec as VideoCodec,
        bitrate: 5000000.5,
      });
      console.log("✓ Float bitrate works (unexpected!)");
      // Don't call close() - source not connected to output
    } catch (e) {
      console.log("✗ Float bitrate failed (expected):", (e as Error).message);
    }

    // Test 4: Try with Math.round() on float
    console.log("\n=== Test 4: Rounded float bitrate ===");
    try {
      const source4 = new CanvasSource(canvas, {
        codec: videoCodec as VideoCodec,
        bitrate: Math.round(5000000.5),
      });
      console.log("✓ Rounded bitrate works");
      // Don't call close() - source not connected to output
    } catch (e) {
      console.error("✗ Rounded bitrate failed:", e);
      throw e;
    }

    // Test 5: Try with NaN (should fail)
    console.log("\n=== Test 5: NaN bitrate ===");
    try {
      const source5 = new CanvasSource(canvas, {
        codec: videoCodec as VideoCodec,
        bitrate: NaN,
      });
      console.log("✗ NaN bitrate works (unexpected!)");
      // Don't call close() - source not connected to output
    } catch (e) {
      console.log("✓ NaN bitrate failed (expected):", (e as Error).message);
    }

    // Test 6: Try with 0 (should fail)
    console.log("\n=== Test 6: Zero bitrate ===");
    try {
      const source6 = new CanvasSource(canvas, {
        codec: videoCodec as VideoCodec,
        bitrate: 0,
      });
      console.log("✗ Zero bitrate works (unexpected!)");
      // Don't call close() - source not connected to output
    } catch (e) {
      console.log("✓ Zero bitrate failed (expected):", (e as Error).message);
    }
  });

  it("should simulate real video processing scenario", async () => {
    const scenarios = [
      { name: "Valid bitrate (float)", averageBitrate: 5284723.45 },
      { name: "Valid bitrate (integer)", averageBitrate: 5000000 },
      { name: "Zero bitrate", averageBitrate: 0 },
      { name: "NaN bitrate", averageBitrate: NaN },
      { name: "Undefined bitrate", averageBitrate: undefined as any },
    ];

    const canvas = new OffscreenCanvas(640, 360);
    const format = new Mp4OutputFormat();
    const videoCodec = await getFirstEncodableVideoCodec(
      format.getSupportedVideoCodecs(),
      { width: 640, height: 360 },
    );

    if (!videoCodec) throw new Error("No codec");

    // Note: We don't call close() on sources that aren't connected to an output track
    // as mediabunny throws "Cannot call close without connecting the source to an output track"

    for (const scenario of scenarios) {
      console.log(`\nTesting: ${scenario.name}`);
      console.log(
        `  Raw value: ${scenario.averageBitrate} (${typeof scenario.averageBitrate})`,
      );

      const bitrate = scenario.averageBitrate;

      let validBitrate1;
      if (bitrate && bitrate > 0) {
        validBitrate1 = bitrate;
      } else {
        validBitrate1 = QUALITY_HIGH;
      }
      console.log(`  Current logic result: ${validBitrate1}`);

      try {
        const source = new CanvasSource(canvas, {
          codec: videoCodec as VideoCodec,
          bitrate: validBitrate1,
        });
        console.log(`  ✓ Current logic WORKS`);
        // Don't call close() - source not connected to output
      } catch (e) {
        console.log(`  ✗ Current logic FAILS: ${(e as Error).message}`);
      }

      let validBitrate2;
      if (Number.isFinite(bitrate) && bitrate > 0) {
        validBitrate2 = Math.round(bitrate);
      } else {
        validBitrate2 = QUALITY_HIGH;
      }
      console.log(
        `  Improved logic result: ${validBitrate2} (${typeof validBitrate2})`,
      );

      try {
        const source = new CanvasSource(canvas, {
          codec: videoCodec as VideoCodec,
          bitrate: validBitrate2,
        });
        console.log(`  ✓ Improved logic WORKS`);
        // Don't call close() - source not connected to output
      } catch (e) {
        console.log(`  ✗ Improved logic FAILS: ${(e as Error).message}`);
      }
    }
  });
});
