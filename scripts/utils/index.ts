import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import { TokenInput } from "../../interfaces";

/**
 * Generates metadata JSON and uploads it to IPFS via Pinata
 * Returns IPFS URI
 */
/**
 * Uploads token metadata to IPFS via Pinata.
 * Throws if PINATA_JWT is not set or upload fails.
 */
export async function uploadMetadataToIPFS(
  tokenObj: TokenInput
): Promise<string> {
  if (!process.env.PINATA_JWT) {
    throw new Error(
      "PINATA_JWT environment variable is not set. Please set it in your .env file."
    );
  }
  // === Construct metadata ===
  const metadata = {
    name: tokenObj.tokenName,
    symbol: tokenObj.tokenSymbol,
    description: tokenObj.description || "",
    image: tokenObj.imageUrl || "",
    properties: {
      website: tokenObj.website || "",
      links: tokenObj.socialLinks || [],
    },
  };
  try {
    const res = await axios.post(
      `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
      metadata,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );
    const ipfsHash = res.data.IpfsHash;
    console.log("Metadata uploaded to IPFS:", ipfsHash);
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  } catch (err) {
    console.error("Failed to upload metadata to IPFS:", err);
    throw err;
  }
}
