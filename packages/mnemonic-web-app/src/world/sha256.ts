// Minimal, deterministic SHA-256 (sync, no deps).
// Based on FIPS 180-4; operates on UTF-8 bytes; returns lowercase hex.

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function ch(x: number, y: number, z: number): number {
  return (x & y) ^ (~x & z);
}

function maj(x: number, y: number, z: number): number {
  return (x & y) ^ (x & z) ^ (y & z);
}

function bigSigma0(x: number): number {
  return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
}

function bigSigma1(x: number): number {
  return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
}

function smallSigma0(x: number): number {
  return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
}

function smallSigma1(x: number): number {
  return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);
}

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function toHex32(x: number): string {
  return (x >>> 0).toString(16).padStart(8, "0");
}

function utf8Bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function sha256HexUtf8(s: string): string {
  return sha256HexBytes(utf8Bytes(s));
}

export function sha256HexBytes(bytes: Uint8Array): string {
  // Initial hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Pre-processing (padding)
  const l = bytes.length;
  const bitLenHi = Math.floor((l * 8) / 0x100000000);
  const bitLenLo = (l * 8) >>> 0;

  const withOne = l + 1;
  const padLen = (withOne % 64 <= 56) ? (56 - (withOne % 64)) : (56 + (64 - (withOne % 64)));
  const totalLen = withOne + padLen + 8;

  const msg = new Uint8Array(totalLen);
  msg.set(bytes, 0);
  msg[l] = 0x80;
  // last 8 bytes: big-endian length
  msg[totalLen - 8] = (bitLenHi >>> 24) & 0xff;
  msg[totalLen - 7] = (bitLenHi >>> 16) & 0xff;
  msg[totalLen - 6] = (bitLenHi >>> 8) & 0xff;
  msg[totalLen - 5] = bitLenHi & 0xff;
  msg[totalLen - 4] = (bitLenLo >>> 24) & 0xff;
  msg[totalLen - 3] = (bitLenLo >>> 16) & 0xff;
  msg[totalLen - 2] = (bitLenLo >>> 8) & 0xff;
  msg[totalLen - 1] = bitLenLo & 0xff;

  const w = new Uint32Array(64);
  for (let off = 0; off < msg.length; off += 64) {
    // message schedule
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      w[i] =
        (msg[j] << 24) |
        (msg[j + 1] << 16) |
        (msg[j + 2] << 8) |
        (msg[j + 3] << 0);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = smallSigma0(w[i - 15]!);
      const s1 = smallSigma1(w[i - 2]!);
      w[i] = (((w[i - 16]! + s0) >>> 0) + ((w[i - 7]! + s1) >>> 0)) >>> 0;
    }

    // working vars
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let hh = h7;

    for (let i = 0; i < 64; i++) {
      const t1 = (((((hh + bigSigma1(e)) >>> 0) + ch(e, f, g)) >>> 0) + K[i]!) >>> 0;
      const t2 = (bigSigma0(a) + maj(a, b, c)) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + hh) >>> 0;
  }

  return (
    toHex32(h0) +
    toHex32(h1) +
    toHex32(h2) +
    toHex32(h3) +
    toHex32(h4) +
    toHex32(h5) +
    toHex32(h6) +
    toHex32(h7)
  );
}

