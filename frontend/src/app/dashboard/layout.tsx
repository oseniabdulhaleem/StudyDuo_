"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthHeader } from "@/lib/utils"; 
import {
  BookOpen,
  Home,
  Plus,
  Settings,
  List,
  User,
  LogOut,
  Menu,
  Loader2,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { createDropdownMenuScope } from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [credits, setCredits] = useState<number>(0);

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletLoading, setWalletLoading] = useState(false);

  const handleTransactionEvents = (event: any) => {
    if (event?.data?.name?.startsWith("starkey-transaction-")) {
      console.log("event received");
      console.log(event?.data?.name);
      console.log(event?.data?.data?.tx);

      const status = event?.data?.name?.replace("starkey-transaction-", "");
      const tx = event?.data?.data?.tx;
      console.log("status tx", status, tx);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleTransactionEvents);

    return () => {
      window.removeEventListener("message", handleTransactionEvents);
    };
  }, []);

  const connectWallet = async () => {
    if ("starkey" in window) {
      const provider = window.starkey?.supra;
      try {
        const accounts = await provider.connect();
        setWalletAddress(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    } else {
      window.open("https://starkey.app/", "_blank");
    }
  };

  const buyCredits = async () => {
    if ("starkey" in window) {
      try {
        setWalletLoading(true);
        const provider = window.starkey?.supra;

        // Listen for payment event
        // provider.on("transaction", (event) => {
        //   if (event.data?.name === "PaymentEvent") {
        //     const { sender, amount, credits_issued } = event.data;
        //     console.log(
        //       `Purchased ${credits_issued} credits for ${amount} SUPRA`
        //     );
        //     // toast.success(
        //     //   `Purchased ${credits_issued} credits for ${amount} SUPRA`
        //     // );
        //   }
        // });
        window?.starKeyWallet?.onMessage((message) => {
          console.log("message received from swallet", message);
        });
        const tx = {
          from: walletAddress,
          to: "0xf31529a52fa408e0290d5321ef822db3294f5cfea9ef5c878e69192985b06ac7",
          module: "credit_payment",
          function: "buy_credits",
          value: "250000000",
          type_args: ["0x1::supra_coin::SupraCoin"],
          args: [],
        };
        const txHash = await provider.sendTransaction(tx);
        console.log("Transaction:", txHash);
        // Wait for transaction confirmation
        await new Promise((resolve) => setTimeout(resolve, 5000));
        // Check transaction status
        const response = await fetch(
          `https://rpc-testnet.supra.com/rpc/v1/transactions/${txHash}`
        );
        const data = await response.json();
        console.log("the data", data)

        if (
          data.status === "Success" &&
          data.output.Move.vm_status === "Executed successfully"
        ) {
          const token = await getAuthHeader();
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/credits/process`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address: walletAddress,
                txHash,
              }),
            }
          );
          // Refresh credits after successful purchase
          await fetchCredits();
        } else {
          console.error("Transaction failed:", data);
          throw new Error("Transaction failed or invalid response");
        }
      } catch (err) {
        console.error("Buy credits error:", err);
      } finally {
        setWalletLoading(false);
      }
    }
  };

  // Add function to fetch credits
  const fetchCredits = async () => {
    try {
      const token = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credits/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };
  // Add useEffect to fetch credits
  useEffect(() => {
    if (user && walletAddress) {
      fetchCredits();
    }
  }, [user, walletAddress]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div>Loading...</div>; // You might want to create a proper loading component
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        {/* Sidebar - Hidden on mobile, visible on lg screens */}
        <AppSidebar className="hidden lg:block" />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-4 bg-white shadow-sm">
            <div className="flex items-center gap-4">
              {/* Mobile Sidebar Trigger */}
              <SidebarTrigger className="lg:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>

              {/* Page Title */}
              <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            </div>
            {walletAddress ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <Badge variant="secondary">Credits: {credits}</Badge>
                <Button onClick={buyCredits} disabled={walletLoading}>
                  {walletLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Buy Credits
                </Button>
              </div>
            ) : (
              <Button onClick={connectWallet}>Connect Wallet</Button>
            )}
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={user.displayName || "User"}
                  />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
