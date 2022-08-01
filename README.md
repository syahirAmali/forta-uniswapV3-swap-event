# UniswapV3 Swap Event Bot

## Description

This bot detects a UniswapV3 `Swap` event emissions from the UniswapV3 protocol.

## Supported Chains

- Ethereum

## Alerts

- UNISWAP-SWAP-1
  - Fired when a uniswapV3 swap event is emitted
  - Severity is always set to "info"
  - Type is always set to "info" 
  - Metadata fields
    - `pool address`: the pool address of the swap
    - `token0 address`: the token0 address of the token from the pool
    - `token1 address`: the token1 address of the token from the pool
    - `pool fee`: the fee for the pool
    - `sender`: sender for the swap
    - `amount0`: amount of token0 for the swap  
    - `amount1`: amount of token1 for the swap  

## Test Data

The agent behaviour can be verified with the following transactions:

Multiple uniswapV3 `Swap` Event Emissions

- [0xe4c829982fd640503b8699f225359ff421fc21e0b69530428706e9cd69af9c50](https://etherscan.io/tx/0xe4c829982fd640503b8699f225359ff421fc21e0b69530428706e9cd69af9c50) 
