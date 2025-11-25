/*
 * This example demonstrates how to update a DID document using the
 * `updateDID` function with a client instance.
 */
import { Client, PrivateKey } from '@hashgraph/sdk';
import { KeysUtility } from '@swiss-digital-assets-institute/core';
import { updateDID } from '@swiss-digital-assets-institute/registrar';

const accountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
const operatorPrivateKey = process.env.HEDERA_TESTNET_PRIVATE_KEY;
const did = process.env.HEDERA_TESTNET_DID; // Set this to the DID you just created

if (!accountId || !operatorPrivateKey) {
  throw new Error('Missing HEDERA_TESTNET_ACCOUNT_ID or HEDERA_TESTNET_PRIVATE_KEY in environment');
}

if (!did) {
  throw new Error('Missing HEDERA_TESTNET_DID in environment. Please set it to the DID you created.');
}

const client = Client.forTestnet();
client.setOperator(accountId, operatorPrivateKey);

async function main() {
  try {
    // Derive the multibase public key from the provided private key to ensure it matches the DID root key
    const rootKey = PrivateKey.fromStringED25519(operatorPrivateKey);
    const publicKeyMultibase = KeysUtility.fromPublicKey(rootKey.publicKey).toMultibase();

    const updatedDidDocument = await updateDID(
      {
        did,
        updates: [
          {
            operation: 'add-verification-method',
            id: '#key-1',
            property: 'verificationMethod',
            publicKeyMultibase,
          },
          {
            operation: 'add-service',
            id: '#service-1',
            type: 'VerifiableCredentialService',
            serviceEndpoint: 'https://example.com/vc/',
          },
        ],
        privateKey: operatorPrivateKey,
      },
      {
        client,
      },
    );

    console.log(
      `Updated DID Document: ${JSON.stringify(updatedDidDocument, null, 2)}`,
    );
  } catch (error) {
    console.error('Error updating DID:', error);
  }
}

main().finally(() => client.close());
