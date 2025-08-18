import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createCreateMetadataAccountV3Instruction,
  DataV2,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

export const createMetadataForToken = async ({
  mint,
  payer,
  connection,
  metadataUri,
  name,
  symbol,
}: {
  mint: PublicKey;
  payer: Keypair;
  connection: Connection;
  metadataUri: string; // uploaded IPFS URI
  name: string;
  symbol: string;
}) => {
  // 1. Get metadata account address
  const metadataPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), PROGRAM_ID.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  )[0];

  // 2. Build metadata structure
  const metadataData: DataV2 = {
    name: name,
    symbol: symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0, // No royalties since this is FT
    creators: null, // Optional: You can add yourself here if you want
    collection: null,
    uses: null,
  };

  // 3. Create instruction
  const instruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: metadataData,
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  // 4. Send transaction
  const tx = new Transaction().add(instruction);
  const txid = await sendAndConfirmTransaction(connection, tx, [payer]);

  console.log("Metadata attached to token mint");
  console.log("Metadata account:", metadataPDA.toBase58());
  console.log("Tx ID:", txid);
  return txid;
};
