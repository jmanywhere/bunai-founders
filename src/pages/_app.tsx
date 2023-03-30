import { type AppType } from "next/dist/shared/lib/utils";

import "@/styles/globals.css";

import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

const chains = [mainnet, sepolia];
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Missing WalletConnect project ID");
}

const { provider } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 1, chains }),
  provider,
});
const ethereumClient = new EthereumClient(wagmiClient, chains);

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <WagmiConfig client={wagmiClient}>
        <Component {...pageProps} />
      </WagmiConfig>
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeMode="dark"
        themeVariables={{
          "--w3m-accent-color": "#0377c9",
        }}
      />
    </>
  );
};

export default MyApp;
