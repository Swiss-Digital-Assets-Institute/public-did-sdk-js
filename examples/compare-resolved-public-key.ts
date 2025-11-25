/*
 * This example resolves a DID (as JSON), extracts the public key from the
 * DID Document, derives the public key from HEDERA_TESTNET_PRIVATE_KEY, and
 * compares the two. The result of the comparison is written to the console.
 */

import { resolveDID } from "@swiss-digital-assets-institute/resolver";
import { PrivateKey } from "@hashgraph/sdk";
import { base58 } from "@scure/base";

const did = process.env.HEDERA_TESTNET_DID;
const operatorPrivateKey = process.env.HEDERA_TESTNET_PRIVATE_KEY;

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("Invalid hex string length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

async function main() {
  try {
    if (!did) throw new Error("HEDERA_TESTNET_DID is not set in environment");
    if (!operatorPrivateKey)
      throw new Error("HEDERA_TESTNET_PRIVATE_KEY is not set in environment");

    // 1) Resolve the DID Document in JSON format
    const didDocument = await resolveDID(did, "application/did+json");

    // 2) Extract a public key from the DID Document (prefer multibase, fallback to base58)
    const vm = (didDocument?.verificationMethod ?? []) as Array<
      | { publicKeyMultibase: string; id: string; type: string; controller: string }
      | { publicKeyBase58: string; id: string; type: string; controller: string }
    >;

    if (!vm.length) {
      throw new Error("Resolved DID Document has no verificationMethod entries to extract public key from");
    }

    let docPublicKeyMultibase: string | undefined;
    let docPublicKeyBase58: string | undefined;

    // Try to find an Ed25519 key specifically
    const preferred = vm.find((v) => v.type?.startsWith("Ed25519")) ?? vm[0];

    if ("publicKeyMultibase" in preferred && preferred.publicKeyMultibase) {
      docPublicKeyMultibase = preferred.publicKeyMultibase;
      if (docPublicKeyMultibase.startsWith("z")) {
        // canonical multibase for base58btc
        docPublicKeyBase58 = docPublicKeyMultibase.slice(1);
      }
    } else if ("publicKeyBase58" in preferred && preferred.publicKeyBase58) {
      docPublicKeyBase58 = preferred.publicKeyBase58;
      docPublicKeyMultibase = `z${docPublicKeyBase58}`;
    } else {
      throw new Error("Selected verification method does not contain a supported public key field");
    }

    // 3) Derive the public key from the private key in the environment
    // The examples/.env uses a DER-encoded Ed25519 private key in HEX (PKCS#8),
    // which Hedera SDK can parse via fromStringED25519.
    const priv = PrivateKey.fromStringED25519(operatorPrivateKey);
    const pub = priv.publicKey;

    // Obtain the raw 32-byte Ed25519 public key as a hex string then to bytes
    const pubHexRaw = pub.toStringRaw();
    const pubBytes = hexToBytes(pubHexRaw);

    // Encode to base58btc (and multibase form with 'z' prefix)
    const derivedBase58 = base58.encode(pubBytes);
    const derivedMultibase = `z${derivedBase58}`;

    // 4) Compare and report
    const matchesBase58 = docPublicKeyBase58 === derivedBase58;
    const matchesMultibase = docPublicKeyMultibase === derivedMultibase;
    const matchesEither = matchesBase58 || matchesMultibase;

    console.log("Resolved DID Document public key (multibase):", docPublicKeyMultibase);
    console.log("Resolved DID Document public key (base58):  ", docPublicKeyBase58);
    console.log("Derived public key from private key (multibase):", derivedMultibase);
    console.log("Derived public key from private key (base58):  ", derivedBase58);

    if (matchesEither) {
      console.log("Public key comparison result: MATCH ✅");
    } else {
      console.log("Public key comparison result: MISMATCH ❌");
    }
  } catch (error) {
    console.error("Error comparing public keys:", error);
  }
}

main();
