import { WalletContextProvider } from "@/components/wallet-provider";
import { ValidatorDataProviderContext } from "@/components/app/data-context";
import { StrategyProvider } from "@/components/app/strategy-context";
import { HistoryProvider } from "@/components/app/history-context";
import { AppNav } from "@/components/app/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <ValidatorDataProviderContext>
        <HistoryProvider>
          <StrategyProvider>
            <div className="min-h-screen bg-sm-bg">
              <AppNav />
              <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
            </div>
          </StrategyProvider>
        </HistoryProvider>
      </ValidatorDataProviderContext>
    </WalletContextProvider>
  );
}
