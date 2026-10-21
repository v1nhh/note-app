import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  hash as argon2Hash,
  verify as argon2Verify,
  Algorithm,
} from "@node-rs/argon2";

const scryptAsync = promisify(scrypt);

export const PASSWORD_ALGORITHMS = {
  ARGON2ID: "argon2id",
  SCRYPT: "scrypt",
};

// Instellingen volgens de OWASP Password Storage Cheat Sheet.
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // 19 MiB geheugen per hash
  timeCost: 2, // aantal doorlopen
  parallelism: 1,
};

const SCRYPT_PARAMS = {
  logN: 16, // N = 2^16 = 65536
  r: 8,
  p: 1,
  keyLength: 32,
  saltLength: 16,
};

// scrypt gebruikt 128 * N * r bytes geheugen. Node staat standaard maar 32 MB
// toe, dus maxmem moet hoger.
function scryptMaxmem({ logN, r }) {
  return 128 * 2 ** logN * r * 2;
}

async function hashWithScrypt(plainPassword) {
  const { logN, r, p, keyLength, saltLength } = SCRYPT_PARAMS;

  const salt = randomBytes(saltLength);
  const derived = await scryptAsync(plainPassword, salt, keyLength, {
    N: 2 ** logN,
    r,
    p,
    maxmem: scryptMaxmem(SCRYPT_PARAMS),
  });

  // Zelfde opbouw als argon2: algoritme, parameters, salt, hash.
  return `$scrypt$ln=${logN},r=${r},p=${p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

async function verifyWithScrypt(storedHash, plainPassword) {
  const [, , params, saltPart, hashPart] = storedHash.split("$");
  if (!params || !saltPart || !hashPart) return false;

  // "ln=16,r=8,p=1" -> { ln: 16, r: 8, p: 1 }
  const parsed = Object.fromEntries(
    params.split(",").map((pair) => {
      const [key, value] = pair.split("=");
      return [key, Number(value)];
    }),
  );

  if (!Number.isInteger(parsed.ln) || !parsed.r || !parsed.p) return false;

  const salt = Buffer.from(saltPart, "base64");
  const expected = Buffer.from(hashPart, "base64");

  const derived = await scryptAsync(plainPassword, salt, expected.length, {
    N: 2 ** parsed.ln,
    r: parsed.r,
    p: parsed.p,
    maxmem: scryptMaxmem({ logN: parsed.ln, r: parsed.r }),
  });

  // Geen === gebruiken: die stopt bij het eerste verschil, en aan de tijd kun
  // je dan zien hoeveel er klopte (timing attack). timingSafeEqual vergelijkt
  // altijd alles. Hij geeft een fout bij verschillende lengtes, daarom eerst
  // de lengte controleren.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function hashPassword(
  plainPassword,
  algorithm = PASSWORD_ALGORITHMS.ARGON2ID,
) {
  if (algorithm === PASSWORD_ALGORITHMS.SCRYPT) {
    return hashWithScrypt(plainPassword);
  }

  if (algorithm === PASSWORD_ALGORITHMS.ARGON2ID) {
    // argon2 maakt zelf een salt en geeft een PHC-string terug.
    return argon2Hash(plainPassword, ARGON2_OPTIONS);
  }

  throw new Error(`Onbekend hash-algoritme: ${algorithm}`);
}

// Het algoritme staat vooraan in de hash. Zo blijven oude wachtwoorden werken
// als we later van algoritme wisselen.
export async function verifyPassword(storedHash, plainPassword) {
  if (typeof storedHash !== "string" || typeof plainPassword !== "string") {
    return false;
  }

  try {
    if (storedHash.startsWith(`$${PASSWORD_ALGORITHMS.ARGON2ID}$`)) {
      return await argon2Verify(storedHash, plainPassword);
    }

    if (storedHash.startsWith(`$${PASSWORD_ALGORITHMS.SCRYPT}$`)) {
      return await verifyWithScrypt(storedHash, plainPassword);
    }

    return false;
  } catch {
    // Een kapotte hash betekent gewoon: niet ingelogd. Geen crash.
    return false;
  }
}