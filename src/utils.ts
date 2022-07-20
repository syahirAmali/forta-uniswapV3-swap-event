import { ethers, getEthersProvider } from "forta-agent";
import { UNI_POOL_ABI } from "./abis/poolAbi";

const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNISWAP_SWAP =
  "event Swap (address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";
const UNISWAP_HEXADEM = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

type saltType = {
  token0: string;
  token1: string;
  fee: number;
};

type create2Type = {
  factoryAddress: string;
  contractSalt: string;
  initCode: string;
};

const UNISWAP_SALT = (saltInput: saltType) => {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint24"],
      [saltInput.token0, saltInput.token1, saltInput.fee]
    )
  );
};

const CREATE2_INPUT = (create2Input: create2Type) => {
  return ethers.utils.solidityKeccak256(
    ["bytes", "address", "bytes", "bytes32"],
    ["0xff", create2Input.factoryAddress, create2Input.contractSalt, create2Input.initCode]
  );
};

const computeAddress = async (factoryAddress: string, [token0, token1, fee]: any, initCode: string) => {
  const saltInput: saltType = {
    token0: token0,
    token1: token1,
    fee: fee,
  };
  const salt = UNISWAP_SALT(saltInput);
  const create2Input: create2Type = {
    factoryAddress: factoryAddress,
    contractSalt: salt,
    initCode: initCode,
  };
  const create2 = CREATE2_INPUT(create2Input);
  const theoretical_address = ethers.utils.hexDataSlice(create2, 12);

  return theoretical_address;
};

const getTokens = async (poolAddress: string) => {
  const prov = getEthersProvider();

  const pool = new ethers.Contract(poolAddress, UNI_POOL_ABI, prov);
  let token0: string = await pool.token0();
  let token1: string = await pool.token1();
  let fee: number = await pool.fee();

  return [token0, token1, fee] as const;
};

type provideInputType = {
  swapEvent: string;
  factoryAddress: string;
  initCode: string;
};

const BOT_INPUTS: provideInputType = {
  swapEvent: UNISWAP_SWAP,
  factoryAddress: UNISWAP_FACTORY_ADDRESS,
  initCode: UNISWAP_HEXADEM,
};

export {
  UNISWAP_FACTORY_ADDRESS,
  UNISWAP_SWAP,
  UNISWAP_HEXADEM,
  computeAddress,
  getTokens,
  provideInputType,
  BOT_INPUTS,
};
