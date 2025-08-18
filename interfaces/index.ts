export type SocialLinks = {
  twitter?: string;
  discord?: string;
  telegram?: string;
  [key: string]: string | undefined;
};

export interface TokenInput {
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  supply: number;
  imageUrl?: string;
  description?: string;
  website?: string;
  socialLinks?: SocialLinks;
}
