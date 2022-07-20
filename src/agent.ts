import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { computeAddress, getTokens, provideInputType, BOT_INPUTS } from "./utils";

export function provideHandleTransaction(botHandlerInputs: provideInputType): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const uniswapSwapEvent = txEvent.filterLog(botHandlerInputs.swapEvent);

    for (const swapEvent of uniswapSwapEvent) {
      const [token0, token1, fee] = await getTokens(swapEvent.address);
      const { sender, amount0, amount1 } = swapEvent.args;

      const poolAddress = await computeAddress(
        botHandlerInputs.factoryAddress,
        [token0, token1, fee],
        botHandlerInputs.initCode
      );

      if (swapEvent.address != poolAddress) return findings;

      findings.push(
        Finding.fromObject({
          name: "UniswapV3 Swap Event Emit",
          description: `UniswapV3 Swap event emit detected for pool contract at: ${swapEvent.address}`,
          alertId: "UNISWAP-SWAP-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Uniswap",
          metadata: {
            "pool address": poolAddress,
            "token0 address": token0,
            "token1 address": token1,
            "pool fee": fee.toString(),
            sender: sender,
            amount0: amount0.toString(),
            amount1: amount1.toString(),
          },
        })
      );
    }
    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(BOT_INPUTS),
};
