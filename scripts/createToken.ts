// To test: npx tsx createToken.ts OR npx ts-node createToken.ts
import { getTokenInputFromPrompt } from "../test/testCreateToken";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { TokenInput } from "../interfaces";

/**
 * Main entry for testing or CLI usage.
 * Prompts user for token details and prints the input.
 * You can call createTokenAndAssociatedAccount(tokenInput, ...) here.
 */
if (require.main === module) {
  try {
    const tokenInput: TokenInput = getTokenInputFromPrompt();
    console.log("Token input:", tokenInput);
  } catch (err) {
    console.error("Error during input prompt:", err);
    process.exit(1);
  }
}

/**
 * Creates a new SPL token mint and associated account, then mints the total supply.
 * Includes error handling and logs each step for production readiness.
 * @param tokenObj TokenInput - Token details (name, symbol, decimals, supply, etc)
 * @param keypair Keypair - The Solana keypair to use as payer and mint authority
 * @param connection Connection - Solana connection object
 * @returns The new mint address as a string
 */
export const createTokenAndAssociatedAccount = async (
  tokenObj: TokenInput,
  keypair: Keypair,
  connection: Connection
): Promise<string | undefined> => {
  try {
    // Check payer balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Payer Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    if (balance === 0) {
      console.log("Payer has 0 SOL. Requesting airdrop of 2 SOL...");
      const airdropSignature = await connection.requestAirdrop(
        keypair.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature, "confirmed");
      console.log("Airdrop successful.");
    }

    const { decimals, supply } = tokenObj;

    // 1. Create Mint
    let mint;
    try {
      mint = await createMint(
        connection,
        keypair,
        keypair.publicKey,
        null, // Freeze Authority: null
        decimals
      );
      console.log("Token Mint Created:", mint.toBase58());
    } catch (err) {
      console.error("Failed to create mint:", err);
      throw err;
    }

    // 2. Create Associated Token Account (ATA)
    let tokenAccount;
    try {
      tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey
      );
      console.log(
        "Associated Token Account Created:",
        tokenAccount.address.toBase58()
      );
    } catch (err) {
      console.error("Failed to create associated token account:", err);
      throw err;
    }

    // 3. Mint Total Supply
    try {
      const mintAmount = BigInt(supply * Math.pow(10, decimals));
      const txSig = await mintTo(
        connection,
        keypair,
        mint,
        tokenAccount.address,
        keypair,
        mintAmount
      );
      console.log("Total Supply Minted:", supply);
      console.log("MintTo Transaction Signature:", txSig);
    } catch (err) {
      console.error("Failed to mint total supply:", err);
      throw err;
    }

    console.log(`Token Mint Address: ${mint.toBase58()}`);
    return mint.toBase58();
  } catch (err) {
    // Top-level error catch for the whole process
    console.error("Error in createTokenAndAssociatedAccount:", err);
    return undefined;
  }
};
