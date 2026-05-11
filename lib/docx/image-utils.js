// Magic-byte-Erkennung für JPEG/PNG/GIF/WebP. Wird sowohl beim Image-Swap im Template als auch beim Anhängen von Anlage-Bildern genutzt.

const IMAGE_MIME_BY_EXT = {
  jpeg: 'image/jpeg',
  jpg:  'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  webp: 'image/webp'
};

function detectImageExtension(buffer) {
  if (!buffer || buffer.length < 12) return 'jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'png';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpeg';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'gif';
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'webp';
  return 'jpeg';
}

// Liest Breite/Höhe in Pixeln aus dem Header eines JPEG/PNG/GIF/WebP-Buffers.
function readImageDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null;
  // PNG: \x89 P N G ... IHDR width(4) height(4)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // JPEG: scan markers for SOFn
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xFF) return null;
      let marker = buffer[offset + 1];
      while (marker === 0xFF && offset + 2 < buffer.length) {
        offset += 1;
        marker = buffer[offset + 1];
      }
      if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7) || marker === 0x01) {
        offset += 2;
        continue;
      }
      const isSOF =
        (marker >= 0xC0 && marker <= 0xCF) && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC;
      if (isSOF) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7)
        };
      }
      const segLen = buffer.readUInt16BE(offset + 2);
      if (segLen < 2) return null;
      offset += 2 + segLen;
    }
    return null;
  }
  // GIF87a / GIF89a: width/height little-endian at offset 6
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    const fourCC = buffer.toString('ascii', 12, 16);
    if (fourCC === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3FFF,
        height: buffer.readUInt16LE(28) & 0x3FFF
      };
    }
    if (fourCC === 'VP8L' && buffer.length >= 25) {
      const b0 = buffer[21], b1 = buffer[22], b2 = buffer[23], b3 = buffer[24];
      return {
        width: 1 + (((b1 & 0x3F) << 8) | b0),
        height: 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
      };
    }
    if (fourCC === 'VP8X' && buffer.length >= 30) {
      return {
        width: 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)),
        height: 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16))
      };
    }
  }
  return null;
}

// Berechnet die gepasste EMU-Größe: Seitenverhältnis erhalten, Box nicht überschreiten (letterbox-fit).
function fitToBox(boxCx, boxCy, imgWidth, imgHeight) {
  if (!imgWidth || !imgHeight || !boxCx || !boxCy) return { cx: boxCx, cy: boxCy };
  const imgAspect = imgWidth / imgHeight;
  const boxAspect = boxCx / boxCy;
  if (imgAspect >= boxAspect) {
    return { cx: boxCx, cy: Math.max(1, Math.round(boxCx / imgAspect)) };
  }
  return { cx: Math.max(1, Math.round(boxCy * imgAspect)), cy: boxCy };
}

module.exports = { IMAGE_MIME_BY_EXT, detectImageExtension, readImageDimensions, fitToBox };
