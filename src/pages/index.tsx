import { Web3Button } from "@web3modal/react";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  useAccount,
  useContractInfiniteReads,
  useContractRead,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { AddressZero } from "@ethersproject/constants";
import { commify, formatEther, parseEther } from "ethers/lib/utils.js";
import flatten from "lodash/flatten";
// Abis
import ABI from "@/abi/FoundersAbi";
import { erc20ABI } from "wagmi";
import {
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
  startTransition,
} from "react";
import classNames from "classnames";

const BUNAI_ADDRESS = "0x4e647c6F3ba33FF9819c167A60ad0bB70ddEBcD0";
const FOUNDERS_LOOT_ADDRESS = "0xE7983087D9354500ACb95f64aE35280514B09e2F";
const FOUNDERS_NFT_ADDRESS = "0xbb520ce73fd6e3f5777f583705db081ba3dd65ac";

const Home: NextPage = () => {
  const [isDefConnected, setIsDefConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { address, isConnected } = useAccount();

  const { data, isLoading } = useContractRead({
    abi: ABI.FounderNFTABI,
    address: FOUNDERS_NFT_ADDRESS,
    functionName: "balanceOf",
    args: !address ? [AddressZero] : [address],
    enabled: !!address,
  });

  const { data: bunaiBalance } = useContractReads({
    contracts: [
      {
        abi: erc20ABI,
        address: BUNAI_ADDRESS,
        functionName: "balanceOf",
        args: !address ? [AddressZero] : [address],
      },
      {
        abi: erc20ABI,
        address: BUNAI_ADDRESS,
        functionName: "allowance",
        args: !address
          ? [AddressZero, AddressZero]
          : [address, FOUNDERS_LOOT_ADDRESS],
      },
    ],
    enabled: !!address,
  });

  useLayoutEffect(() => {
    setIsReady(true);
  }, [setIsReady]);

  const { data: owners, fetchNextPage } = useContractInfiniteReads({
    cacheKey: "ownerOfTokens",
    contracts: (pageParam: number) => {
      const baseParam = pageParam || 1;
      const allRequests = 20;
      const baseParams = {
        abi: ABI.FounderNFTABI,
        address: FOUNDERS_NFT_ADDRESS as `0x${string}`,
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
    enabled: data?.gt(0),
  });
  useEffect(() => {
    if ((owners?.pages.length || 0) > 0 && (owners?.pages.length || 0) < 5) {
      console.log("called fetch");
      void fetchNextPage();
    }
  }, [fetchNextPage, owners]);

  useEffect(() => {
    startTransition(() => {
      setIsDefConnected(isConnected);
    });
  }, [isConnected, setIsDefConnected]);

  const ownedNFTs: number[] = useMemo(() => {
    if (owners?.pages.length === 0 || !owners?.pages) return [] as number[];
    const ids = (owners.pages as Array<Array<`0x${string}`>>).reduce(
      (acc, page, pageIndex: number) => {
        const owned: number[] = [];
        page.map((owner, addressIndex) => {
          if (owner === address)
            owned.push(pageIndex * 20 + (addressIndex + 1));
        });
        return [...acc, ...owned];
      },
      [] as number[]
    );
    if (ids.length / 3 > 1) {
      const tempIds: Array<number | number[]> = ids.map((id, index) => {
        if ((index + 1) % 3 === 0) return [id, 0];
        else return id;
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const flatIds: number[] = flatten<number | number[]>(tempIds) as number[];
      return flatIds;
    }
    return ids;
  }, [owners, address]);

  const { data: pendingClaim, isLoading: claimLoading } = useContractRead({
    abi: ABI.FoundersLoot,
    address: FOUNDERS_LOOT_ADDRESS,
    functionName:
      ownedNFTs.length > 1 ? "pendingRewardFromMultiple" : "pendingRewards",
    args: ownedNFTs.length > 1 ? [ownedNFTs] : [ownedNFTs[0] || 0],
    enabled: ownedNFTs.length > 0,
  });

  const { config: approveConfig } = usePrepareContractWrite({
    abi: erc20ABI,
    address: BUNAI_ADDRESS,
    functionName: "approve",
    args: [FOUNDERS_LOOT_ADDRESS, parseEther("1000000")],
    enabled: ownedNFTs.length > 0,
  });

  const { config: claimConfig, error: configClaimError } =
    usePrepareContractWrite({
      abi: ABI.FoundersLoot,
      address: FOUNDERS_LOOT_ADDRESS,
      functionName: ownedNFTs.length > 1 ? "claimMultiple" : "claim",
      args: ownedNFTs.length > 1 ? [ownedNFTs] : [ownedNFTs[0] || 0],
      enabled: ownedNFTs.length > 0,
    });

  const { write: approveBUNAI, isLoading: approveLoading } =
    useContractWrite(approveConfig);

  const { write: claimETH, isLoading: claimETHLoading } =
    useContractWrite(claimConfig);
  return (
    <>
      <Head>
        <title>Founders Pool</title>
        <meta name="description" content="Bunny AI NFT Founders Reward Pool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen w-full pb-10">
        <header className="flex items-center justify-between px-4 py-6">
          <Link
            className="text-primary_text group flex flex-row items-center rounded-xl p-4 font-bold hover:bg-primary/10"
            href="https://bunai.ai"
            target="_blank"
          >
            <Image
              src="/BUNAIHEADLOGO.png"
              alt="Bunny AI NFT Logo"
              width={1243 / 20}
              height={1383 / 20}
            />
            <div className="primaryText pl-4 text-xl group-hover:text-white">
              Bunny AI Founders
            </div>
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
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <div className="stats shadow">
              <div className="stat min-w-[260px] bg-primary/25">
                <div className="stat-title text-center">$BUNAI in Wallet</div>
                <div className="stat-value py-2 text-center">
                  {(isReady &&
                    (isLoading
                      ? "Loading..."
                      : bunaiBalance?.[0]
                      ? commify(formatEther(bunaiBalance[0].toString())).split(
                          "."
                        )[0]
                      : "0")) ||
                    "0"}
                </div>
                <div className="stat-desc text-center">Balance in Wallet</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat min-w-[260px] bg-primary/25">
                <div className="stat-title text-center">Total NFTs</div>
                <div className="stat-value py-2 text-center">
                  {(isReady && (isLoading ? "Loading..." : data?.toString())) ||
                    "-"}
                </div>
                <div className="stat-desc text-center">
                  Founder NFTs in Wallet
                </div>
              </div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat min-w-[260px] bg-primary/25">
              <div className="stat-title text-center">NFT IDs</div>
              <div className="stat-value whitespace-pre break-words py-2 text-center">
                {(isReady &&
                  ownedNFTs
                    .map((id, index) =>
                      id == 0
                        ? "\n"
                        : index + 1 === ownedNFTs.length
                        ? id
                        : `${id}, `
                    )
                    .join("")) ||
                  "0"}
              </div>
              <div className="stat-desc text-center">IDs in Wallet</div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat min-w-[260px] bg-primary/25">
              <div className="stat-title text-center">Pending Claim</div>
              <div className="stat-value whitespace-pre break-words py-2 text-center">
                {(isReady &&
                  (claimLoading
                    ? "Loading..."
                    : pendingClaim
                    ? commify(formatEther(pendingClaim?.toString()))
                    : "-")) ||
                  "-"}
              </div>
              <div className="stat-desc text-center">ETH pending claim</div>
            </div>
          </div>
          {address && isConnected && isDefConnected && (
            <>
              {bunaiBalance?.[1]?.lt(parseEther("100").mul(ownedNFTs.length)) ||
              bunaiBalance?.[1].eq(0) ? (
                <button
                  className={classNames(
                    "btn-secondary btn-lg btn",
                    approveLoading ? "loading" : ""
                  )}
                  onClick={approveBUNAI}
                >
                  {approveLoading ? "Loading" : "Approve $BUNAI"}
                </button>
              ) : null}
              {bunaiBalance?.[1]?.gt(parseEther("100")) ? (
                <button
                  className={classNames(
                    "btn-primary btn-lg btn",
                    claimETHLoading ? "loading" : ""
                  )}
                  disabled={!!configClaimError}
                  onClick={claimETH}
                >
                  {claimETHLoading ? "Loading" : "Claim Pending"}
                </button>
              ) : null}
            </>
          )}
        </section>
      </main>
    </>
  );
};

export default Home;
