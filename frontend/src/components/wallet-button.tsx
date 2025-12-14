import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  return (
    <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !text-primary-foreground font-semibold !py-2 !px-4 !rounded-lg transition-all" />
  );
}
