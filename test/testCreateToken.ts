import dotenv from "dotenv";
dotenv.config();
import { createTokenAndAssociatedAccount } from "../scripts/createToken";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";
import promptSync from "prompt-sync";
import { SocialLinks, TokenInput } from "../interfaces";
import { uploadMetadataToIPFS } from "../scripts/utils";
import { createMetadataForToken } from "../scripts/tokenMetadata";
const prompt = promptSync();

/**
 * CLI entry point for token creation prompt and minting.
 * Loads keypair from test/keys/id.json, prompts for token details, and mints the token.
 * Includes robust error handling and clear logs for production use.
 */
/**
 * CLI entry point for token creation prompt and minting.
 * Loads keypair from test/keys/id.json, prompts for token details, uploads metadata, mints the token, and registers metadata on-chain.
 * Includes robust error handling and clear logs for production use.
 */
if (require.main === module) {
  (async () => {
    try {
      // Prompt user for token details
      const tokenInput = getTokenInputFromPrompt();
      console.log("Token input:", tokenInput);

      // Load keypair from test/keys/id.json
      const keypairPath = __dirname + "/keys/id.json";
      let secretKey;
      try {
        secretKey = Uint8Array.from(
          JSON.parse(fs.readFileSync(keypairPath, "utf-8"))
        );
      } catch (err) {
        console.error("Failed to load keypair from", keypairPath, err);
        process.exit(1);
      }
      let keypair;
      try {
        keypair = Keypair.fromSecretKey(secretKey);
      } catch (err) {
        console.error("Invalid secret key format:", err);
        process.exit(1);
      }

      // Connect to Solana devnet
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Upload metadata to IPFS (Pinata)
      let metadataUri;
      try {
        metadataUri = await uploadMetadataToIPFS(tokenInput);
        console.log("Metadata URI:", metadataUri);
      } catch (err) {
        console.error("Failed to upload metadata to IPFS:", err);
        process.exit(1);
      }

      // Mint the token and handle errors
      let mintAddress;
      try {
        mintAddress = await createTokenAndAssociatedAccount(
          tokenInput,
          keypair,
          connection
        );
      } catch (err) {
        console.error("Failed to create token and associated account:", err);
        process.exit(1);
      }
      if (mintAddress) {
        console.log("Mint Address:", mintAddress);
        console.log("Keypair public key:", keypair.publicKey.toBase58());
        console.log(
          `View on Solana Explorer: https://explorer.solana.com/address/${mintAddress}?cluster=devnet`
        );

        // Register metadata on-chain
        try {
          const metadataTx = await createMetadataForToken({
            mint: new PublicKey(mintAddress),
            payer: keypair,
            connection,
            metadataUri,
            name: tokenInput.tokenName,
            symbol: tokenInput.tokenSymbol,
          });
          console.log("✅ Metadata registered! Tx:", metadataTx);
        } catch (err) {
          console.error("Failed to register metadata on-chain:", err);
          process.exit(1);
        }
      } else {
        console.error("Token creation failed. See logs above.");
        process.exit(1);
      }
    } catch (err) {
      console.error("Fatal error in CLI flow:", err);
      process.exit(1);
    }
  })();
}

/**
 * Prompts the user for all token input fields via the terminal.
 * Returns a TokenInput object with all required and optional fields.
 */
export function getTokenInputFromPrompt(): TokenInput {
  // Helper to prompt until valid
  function promptRequired(
    label: string,
    validate: (v: string) => string | null
  ): string {
    while (true) {
      const value = prompt(label);
      const error = validate(value);
      if (!error) return value;
      console.error(error);
    }
  }

  const tokenName: string = promptRequired("Token Name: ", (v) =>
    v.trim() ? null : "Token name is required."
  );
  const tokenSymbol: string = promptRequired("Token Symbol: ", (v) =>
    v.trim() ? null : "Token symbol is required."
  );
  const decimals: number = parseInt(
    promptRequired("Decimals (1-18): ", (v) => {
      const n = Number(v);
      if (!v.trim() || isNaN(n))
        return "Decimals is required and must be a number.";
      if (n < 1 || n > 18) return "Decimals must be between 1 and 18.";
      return null;
    }),
    10
  );
  const supply: number = parseFloat(
    promptRequired("Total Supply (>1): ", (v) => {
      const n = Number(v);
      if (!v.trim() || isNaN(n))
        return "Supply is required and must be a number.";
      if (n <= 1) return "Supply must be greater than 1.";
      return null;
    })
  );
  const imageUrl: string = prompt("Image URL (optional): ");
  const description: string = promptRequired("Description: ", (v) =>
    v.trim() ? null : "Description is required."
  );
  const website: string = prompt("Website (optional): ");

  // Collect social links interactively (all optional)
  const socialLinks: SocialLinks = {};
  if (prompt("Add Twitter link? (y/n): ").toLowerCase() === "y") {
    socialLinks.twitter = prompt("Twitter URL: ");
  }
  if (prompt("Add Discord link? (y/n): ").toLowerCase() === "y") {
    socialLinks.discord = prompt("Discord URL: ");
  }
  if (prompt("Add Telegram link? (y/n): ").toLowerCase() === "y") {
    socialLinks.telegram = prompt("Telegram URL: ");
  }
  // Add more social links as needed

  return {
    tokenName,
    tokenSymbol,
    decimals,
    supply,
    imageUrl: imageUrl.trim() || undefined,
    description,
    website: website.trim() || undefined,
    socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined,
  };
}
