import { Web3Button } from "@web3modal/react";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useAccount, useContractInfiniteReads, useContractRead } from "wagmi";
import { AddressZero } from "@ethersproject/constants";
import { commify, formatEther } from "ethers/lib/utils.js";
// Abis
import ABI from "@/abi/FoundersAbi";
import { erc20ABI } from "wagmi";
import { useLayoutEffect, useState, useEffect, useMemo } from "react";

const Home: NextPage = () => {
  const [isReady, setIsReady] = useState(false);

  const { address } = useAccount();

  const { data, isLoading, error } = useContractRead({
    abi: ABI.FounderNFTABI,
    address: "0xbb520ce73fd6e3f5777f583705db081ba3dd65ac",
    functionName: "balanceOf",
    args: ["0x126E8c16b8aD86fd3DC0E8f49583E4486E14DB9D"], //!address ? [AddressZero] : [address],
    enabled: !!address,
  });

  const {
    data: bunaiBalance,
    isLoading: bunaiLoading,
    error: bunaiError,
  } = useContractRead({
    abi: erc20ABI,
    address: "0xC3158937C9E3DFA27267529b8ac429240e6fE9e7",
    functionName: "balanceOf",
    args: ["0x42b756987dEE8a21508C4E470bfEfB5e36A5E4E4"], //!address ? [AddressZero] : [address],
    enabled: !!address,
  });

  useLayoutEffect(() => {
    setIsReady(true);
  }, [setIsReady]);

  const {
    data: owners,
    isError,
    isLoading: ownersLoading,
    fetchNextPage,
  } = useContractInfiniteReads({
    cacheKey: "ownerOfTokens",
    contracts: (pageParam: number) => {
      const baseParam = pageParam || 1;
      const allRequests = 20;
      const baseParams = {
        abi: ABI.FounderNFTABI,
        address: "0xbb520ce73fd6e3f5777f583705db081ba3dd65ac" as `0x${string}`,
        functionName: "ownerOf",
      };
      const allCalls = Array.from({ length: allRequests }, (_, i) => ({
        ...baseParams,
        args: [baseParam + i],
      }));
      return allCalls;
    },
    getNextPageParam(_, pages) {
      return pages.length * 20 + 1;
    },
  });
  useEffect(() => {
    if ((owners?.pages.length || 0) > 0 && (owners?.pages.length || 0) < 5) {
      console.log("called fetch");
      void fetchNextPage();
    }
  }, [fetchNextPage, owners]);

  const ownedNFTs = useMemo(() => {
    if (owners?.pages.length === 0) return [] as number[];
    return (owners?.pages || []).reduce((acc, page, pageIndex) => {
      const owned: number[] = [];
      page.map((owner, addressIndex) => {
        if (
          owner ===
          // address
          "0x126E8c16b8aD86fd3DC0E8f49583E4486E14DB9D"
        )
          owned.push(pageIndex * 20 + (addressIndex + 1));
      });
      return [...acc, ...owned];
    }, [] as number[]);
  }, [owners]);
  return (
    <>
      <Head>
        <title>Founders Pool</title>
        <meta name="description" content="Bunny AI NFT Founders Reward Pool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen w-full">
        <header className="flex justify-between px-4 py-6">
          <Link
            className="text-primary_text text-4xl font-bold"
            href="/"
            target="_blank"
          >
            BunnyAI
          </Link>
          <Web3Button />
        </header>
        <div className="flex w-full flex-row justify-center">
          <h1 className="primaryText whitespace-pre-line text-center text-4xl">
            <span className="font-semibold">Bunny AI NFT</span>
            {"\n"}
            <span className="font-bold">Founder&apos;s Pool</span>
          </h1>
        </div>
        <section className="flex flex-col items-center justify-center gap-y-4 pt-12">
          <div className=" min-w-[220px] rounded-xl border-2 border-purple-500 px-4 py-6 text-center">
            $BUNAI in Wallet
            <br />
            {(isReady &&
              (isLoading
                ? "Loading..."
                : bunaiBalance
                ? commify(formatEther(bunaiBalance.toString())).split(".")[0]
                : "0")) ||
              "0"}
          </div>
          <div className=" min-w-[220px] rounded-xl border-2 border-purple-500 px-4 py-6 text-center">
            Total NFTs
            <br />
            {isReady && isLoading ? "Loading..." : data?.toString() || "-"}
          </div>
          <div className=" min-w-[220px] rounded-xl border-2 border-purple-500 px-4 py-6 text-center">
            NFT IDs
            <br />
            {(isReady && ownedNFTs.join(", ")) || "0"}
          </div>

          <div className=" min-w-[220px] rounded-xl border-2 border-purple-500 px-4 py-6 text-center">
            Pending Claim
            <br />
            {(isReady && (isLoading ? "Loading..." : data?.toString())) || "-"}
          </div>
          <button className="rounded-full bg-indigo-600 px-4 py-2 hover:bg-indigo-400 hover:text-black">
            Approve $BUNAI
          </button>
        </section>
      </main>
    </>
  );
};

export default Home;
