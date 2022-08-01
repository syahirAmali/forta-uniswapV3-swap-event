import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BOT_INPUTS, provideInputType } from "./utils";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { Interface } from "ethers/lib/utils";

const INCORRECT_EVENT = new Interface(["event incorrectEvent(address to, address from)"]);
const EVENT_SWAP_INTERFACE = new Interface([BOT_INPUTS.swapEvent]);
const EVENT_SWAP_INTERFACE_OTHERS = new Interface([
  "event swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data)",
]);
const MOCK_CONTRACT_POOL: string = "0x6c6Bc977E13Df9b0de53b251522280BB72383700";
const MOCK_CONTRACT_POOL_TOKEN0: string = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const MOCK_CONTRACT_POOL_TOKEN1: string = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MOCK_CONTRACT_POOL_OTHERS: string = "0x397ff1542f962076d0bfe58ea045ffa2d347aca0";

const botInputs: provideInputType = {
  swapEvent: BOT_INPUTS.swapEvent,
  factoryAddress: BOT_INPUTS.factoryAddress,
  initCode: BOT_INPUTS.initCode,
};

type findingType = {
  poolAddress: string;
  token0: string;
  token1: string;
  fee: number;
  sender: string;
  amount0: number;
  amount1: number;
};

const createFinding = (findings: findingType): Finding => {
  return Finding.fromObject({
    name: "UniswapV3 Swap Event Emission",
    description: `UniswapV3 Swap event emit detected for pool contract at: ${findings.poolAddress}`,
    alertId: "UNISWAP-SWAP-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Uniswap",
    metadata: {
      pool: findings.poolAddress,
      token0: findings.token0,
      token1: findings.token1,
      fee: findings.fee.toString(),
      sender: findings.sender,
      amount0: findings.amount0.toString(),
      amount1: findings.amount1.toString(),
    },
  });
};

describe("UniswapV3 Swap Event Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let txEvent: TransactionEvent;
  let findings: Finding[];

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(botInputs, getEthersProvider());
  });

  it("should return no findings on empty transaction", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no findings if other events are made", async () => {
    const log = INCORRECT_EVENT.encodeEventLog(INCORRECT_EVENT.getEvent("incorrectEvent"), [
      createAddress("0x001"),
      createAddress("0x002"),
    ]);
    txEvent = new TestTransactionEvent().addAnonymousEventLog(MOCK_CONTRACT_POOL, log.data, ...log.topics);
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings if a swap event is emitted", async () => {
    const log = EVENT_SWAP_INTERFACE.encodeEventLog(EVENT_SWAP_INTERFACE.getEvent("Swap"), [
      createAddress("0x001"),
      createAddress("0x002"),
      1,
      2,
      123,
      1234,
      1234,
    ]);
    txEvent = new TestTransactionEvent().addAnonymousEventLog(MOCK_CONTRACT_POOL, log.data, ...log.topics);
    findings = await handleTransaction(txEvent);

    const trxFindings: findingType = {
      poolAddress: MOCK_CONTRACT_POOL.toLowerCase(),
      token0: MOCK_CONTRACT_POOL_TOKEN0,
      token1: MOCK_CONTRACT_POOL_TOKEN1,
      fee: 500,
      sender: createAddress("0x001"),
      amount0: 1,
      amount1: 2,
    };
    expect(findings).toStrictEqual([createFinding(trxFindings)]);
  });

  it("should detect multiple swap events", async () => {
    const log = EVENT_SWAP_INTERFACE.encodeEventLog(EVENT_SWAP_INTERFACE.getEvent("Swap"), [
      createAddress("0x001"),
      createAddress("0x002"),
      1,
      2,
      123,
      1234,
      1234,
    ]);
    const log2 = EVENT_SWAP_INTERFACE.encodeEventLog(EVENT_SWAP_INTERFACE.getEvent("Swap"), [
      createAddress("0x001"),
      createAddress("0x002"),
      1,
      2,
      123,
      1234,
      1234,
    ]);
    txEvent = new TestTransactionEvent().addAnonymousEventLog(MOCK_CONTRACT_POOL, log.data, ...log.topics).addAnonymousEventLog(MOCK_CONTRACT_POOL, log2.data, ...log2.topics);
    findings = await handleTransaction(txEvent);

    const trxFindings: findingType = {
      poolAddress: MOCK_CONTRACT_POOL.toLowerCase(),
      token0: MOCK_CONTRACT_POOL_TOKEN0,
      token1: MOCK_CONTRACT_POOL_TOKEN1,
      fee: 500,
      sender: createAddress("0x001"),
      amount0: 1,
      amount1: 2,
    };
    expect(findings).toStrictEqual([createFinding(trxFindings), createFinding(trxFindings)]);
  });

  it("should not detect a swap event from a non uniswap pool contract", async () => {
    const log = EVENT_SWAP_INTERFACE_OTHERS.encodeEventLog(EVENT_SWAP_INTERFACE_OTHERS.getEvent("swap"), [
      1,
      2,
      createAddress("0x999"),
      12345,
    ]);
    txEvent = new TestTransactionEvent().addAnonymousEventLog(MOCK_CONTRACT_POOL_OTHERS, log.data, ...log.topics);
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
