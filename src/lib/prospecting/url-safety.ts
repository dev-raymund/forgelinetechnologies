import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type HostAddress = { address: string; family: 4 | 6 };
export type HostResolver = (hostname: string) => Promise<HostAddress[]>;

const defaultResolver: HostResolver = async (hostname) => {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => ({
    address: entry.address,
    family: entry.family as 4 | 6,
  }));
};

export type NormalizedAuditUrl = {
  url: string;
  origin: string;
  hostname: string;
};

function ipv4ToNumber(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const octets = parts.map(Number);
  if (octets.some((octet) => octet > 255)) return null;
  return (((octets[0]! * 256 + octets[1]!) * 256 + octets[2]!) * 256 + octets[3]!) >>> 0;
}

function unsafeIpv4(value: string): boolean {
  const number = ipv4ToNumber(value);
  if (number === null) return true;

  const first = number >>> 24;
  const second = (number >>> 16) & 0xff;
  const inRange = (start: number, end: number) => number >= start && number <= end;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 2) ||
    (first === 192 && second === 88) ||
    (first === 192 && second === 168) ||
    (first === 198 && second >= 18 && second <= 19) ||
    (first === 198 && second === 51) ||
    (first === 203 && second === 0 && ((number >>> 8) & 0xff) === 113) ||
    first >= 224 ||
    inRange(0xc0000200, 0xc00002ff) ||
    inRange(0xc6336400, 0xc63364ff)
  );
}

function expandIpv6(value: string): number[] | null {
  const address = value.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0]!;
  const pieces = address.split("::");
  if (pieces.length > 2) return null;

  const parse = (part: string): number[] => {
    if (!part) return [];
    const parts = part.split(":");
    const result: number[] = [];
    for (const item of parts) {
      if (item.includes(".")) {
        const ipv4 = ipv4ToNumber(item);
        if (ipv4 === null) return [];
        result.push((ipv4 >>> 16) & 0xffff, ipv4 & 0xffff);
      } else if (/^[0-9a-f]{1,4}$/.test(item)) {
        result.push(Number.parseInt(item, 16));
      } else {
        return [];
      }
    }
    return result;
  };

  const left = parse(pieces[0]!);
  const right = parse(pieces[1] ?? "");
  if (left.length === 0 && right.length === 0 && address !== "::") return null;
  if (pieces.length === 1) return left.length === 8 ? left : null;
  if (left.length + right.length >= 8) return null;
  return [...left, ...new Array(8 - left.length - right.length).fill(0), ...right];
}

function unsafeIpv6(value: string): boolean {
  const groups = expandIpv6(value);
  if (!groups) return true;
  const allZero = groups.every((group) => group === 0);
  const loopback = allZero || (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1);
  const uniqueLocal = (groups[0]! & 0xfe00) === 0xfc00;
  const linkLocal = (groups[0]! & 0xffc0) === 0xfe80;
  const multicast = (groups[0]! & 0xff00) === 0xff00;
  const documentation = groups[0] === 0x2001 && groups[1] === 0x0db8;
  const mappedIpv4 = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;

  if (mappedIpv4) {
    const mapped = `${groups[6]! >>> 8}.${groups[6]! & 0xff}.${groups[7]! >>> 8}.${groups[7]! & 0xff}`;
    return unsafeIpv4(mapped);
  }

  return loopback || uniqueLocal || linkLocal || multicast || documentation || groups.slice(0, 6).every((group) => group === 0);
}

function unsafeAddress(address: string, family?: 4 | 6): boolean {
  const cleaned = address.replace(/^\[|\]$/g, "");
  const detectedFamily = family ?? (isIP(cleaned) as 4 | 6);
  if (detectedFamily === 4) return unsafeIpv4(cleaned);
  if (detectedFamily === 6) return unsafeIpv6(cleaned);
  return true;
}

export async function assertSafeUrl(url: URL, resolveHost: HostResolver = defaultResolver): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Audit URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password) throw new Error("Audit URL credentials are not allowed.");

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const literalFamily = isIP(hostname) as 4 | 6 | 0;
  if (!hostname || (literalFamily !== 0 && unsafeAddress(hostname, literalFamily))) {
    throw new Error("Audit URL resolves to an unsafe or private address.");
  }

  const addresses = await resolveHost(hostname);
  if (addresses.length === 0 || addresses.some((entry) => unsafeAddress(entry.address, entry.family))) {
    throw new Error("Audit URL resolves to an unsafe or private address.");
  }
}

export async function normalizeAuditUrl(
  input: string,
  resolveHost: HostResolver = defaultResolver,
): Promise<NormalizedAuditUrl> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Enter a complete website URL.");
  }

  await assertSafeUrl(url, resolveHost);
  url.hash = "";
  return { url: url.toString(), origin: url.origin, hostname: url.hostname };
}
