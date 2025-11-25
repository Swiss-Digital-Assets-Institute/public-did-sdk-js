/*
 * This example demonstrates how to resolve a DID and retrieve its
 * corresponding DID Document in JSON format using the `resolveDID`
 * function.
 */
import { resolveDID } from "@swiss-digital-assets-institute/resolver";

const did = process.env.HEDERA_TESTNET_DID; // Set this to the DID you just created

async function main() {
  try {
    const didDocument = await resolveDID(did, "application/did+json");
    console.log(didDocument);
  } catch (error) {
    console.error("Error resolving DID:", error);
  }
}

main();