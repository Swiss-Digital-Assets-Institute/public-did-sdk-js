/*
  This example creates a public (no submit key) Hedera Consensus Service topic
  using the account and private key from examples/.env. Only an admin key is set
  so anyone can submit messages, but only the admin can update/delete the topic.
*/

import { Client, PrivateKey, TopicCreateTransaction } from "@hashgraph/sdk";

const accountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
const operatorPrivateKey = process.env.HEDERA_TESTNET_PRIVATE_KEY;

if (!accountId || !operatorPrivateKey) {
  throw new Error(
    "Missing HEDERA_TESTNET_ACCOUNT_ID or HEDERA_TESTNET_PRIVATE_KEY in environment."
  );
}

const client = Client.forTestnet();
client.setOperator(accountId, operatorPrivateKey);

async function main() {
  try {
    // Derive the admin public key from the operator's private key in .env
    const adminPublicKey = PrivateKey.fromString(operatorPrivateKey).publicKey;

    // Create a topic with ONLY an admin key (no submit key -> public topic)
    const tx = new TopicCreateTransaction()
      .setAdminKey(adminPublicKey)
      // optional: set a memo to help identify the topic on explorers
      .setTopicMemo("Public topic created by example script (admin key only)");

    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    const topicId = receipt.topicId?.toString();

    console.log("Topic created successfully.");
    console.log(`Topic ID: ${topicId}`);
    console.log(
      "This is a public topic (no submit key). Anyone can submit messages; only the admin can update/delete."
    );
  } catch (error) {
    console.error("Error creating public topic:", error);
  }
}

main().finally(() => client.close());
