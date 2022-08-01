import { ethers } from "forta-agent";
import { providers } from "ethers";
import { getCreate2Address } from "@ethersproject/address";
import TokenFetcher from "./tokenFetcher";

const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const SWAP_ABI =
  "event Swap (address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";
const UNI_INIT_CODE = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

type saltType = {
  token0: string;
  token1: string;
  fee: number;
};

const uniswapSalt = (saltInput: saltType) => {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint24"],
      [saltInput.token0, saltInput.token1, saltInput.fee]
    )
  );
};

const computeAddress = (factoryAddress: string, [token0, token1, fee]: any, initCode: string) => {
  const saltInput: saltType = {
    token0: token0,
    token1: token1,
    fee: fee,
  };
  const salt = uniswapSalt(saltInput);

  const returnedCreate2Address = getCreate2Address(factoryAddress, salt, initCode).toLowerCase();

  return returnedCreate2Address;
};

const getTokens = async (poolAddress: string, provider: providers.Provider) => {
  const tokenFetcher: TokenFetcher = new TokenFetcher(poolAddress, provider);

  const tokenInfo = await tokenFetcher.getPoolInfo();

  return [tokenInfo.token0, tokenInfo.token1, tokenInfo.fee] as const;
};

type provideInputType = {
  swapEvent: string;
  factoryAddress: string;
  initCode: string;
};

const BOT_INPUTS: provideInputType = {
  swapEvent: SWAP_ABI,
  factoryAddress: UNISWAP_FACTORY_ADDRESS,
  initCode: UNI_INIT_CODE,
};

export { computeAddress, getTokens, provideInputType, BOT_INPUTS };
