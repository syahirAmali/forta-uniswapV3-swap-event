import { ethers, getEthersProvider } from "forta-agent";
import { Contract, providers } from "ethers";
import LRU from "lru-cache";
import { UNI_POOL_ABI } from "./abis/poolAbi";

type poolInfoType = {
  token0: string;
  token1: string;
  fee: number;
};

export default class TokenFetcher {
  readonly provider;
  private cache: LRU<string, poolInfoType>;
  private poolAddress: string;
  private pool: Contract;

  constructor(poolAddress: string, provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, poolInfoType>({
      max: 10000,
    });
    this.poolAddress = poolAddress;
    this.pool = new ethers.Contract(poolAddress, UNI_POOL_ABI, this.provider);
  }

  public async getPoolInfo(): Promise<poolInfoType>{
    const key: string = this.poolAddress;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<poolInfoType>;

    let token0: string;
    let token1: string;
    let fee: number;

    try{
      token0 = await this.pool.token0();
      token1 = await this.pool.token1();
      fee = await this.pool.fee();
    }catch{
      throw new Error("Invalid Pool");
    }

    const poolInput: poolInfoType = {
      token0: token0,
      token1: token1,
      fee: fee
    }

    this.cache.set(key, poolInput);
    
    return this.cache.get(key) as any;
  }
}