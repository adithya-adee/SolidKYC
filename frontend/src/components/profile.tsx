import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { CheckIcon, ChevronDown, CopyIcon, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

export default function Profile({ publicKey }: { publicKey: string }) {
  const [copied, setCopied] = useState(false);
  const { disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      toast.success("Address copied to clipboard!", {
        description: shortenAddress(publicKey),
      });
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy address");
    }
  };

  const handleChangeWallet = () => {
    setVisible(true);
    toast.info("Wallet selector opened");
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected successfully");
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="group relative flex items-center gap-3 bg-primary/10 backdrop-blur-md border-primary/30 rounded-lg px-4 py-2.5 hover:bg-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
        >
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />

          {/* Public Key Display */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Connected
            </span>
            <p className="text-foreground text-sm font-mono font-semibold tracking-wide">
              {shortenAddress(publicKey)}
            </p>
          </div>

          {/* Dropdown Indicator */}
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 bg-card/95 backdrop-blur-xl border shadow-2xl"
        align="end"
      >
        <DropdownMenuLabel className="text-muted-foreground">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Connected Wallet</span>
            <span className="text-sm font-mono text-foreground break-all">
              {publicKey}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Copy Address */}
        <DropdownMenuItem
          onClick={copyToClipboard}
          className="flex items-center gap-3 cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4" />
              <span>Copy Address</span>
            </>
          )}
        </DropdownMenuItem>

        {/* Change Wallet */}
        <DropdownMenuItem
          onClick={handleChangeWallet}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Wallet className="w-4 h-4" />
          <span>Change Wallet</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Disconnect */}
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="flex items-center gap-3 cursor-pointer text-red-500 focus:text-red-500"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
