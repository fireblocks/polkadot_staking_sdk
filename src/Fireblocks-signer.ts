import {
  FireblocksSDK,
  RawMessageData,
  TransactionArguments,
  TransactionOperation,
  PeerType,
  TransactionStatus,
} from "fireblocks-sdk";

import { SignerOptions } from "@polkadot/api/submittable/types";
import type { Signer, SignerResult } from "@polkadot/api/types";
import type { SignerPayloadRaw } from "@polkadot/types/types";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { assert, hexToU8a, u8aToHex } from "@polkadot/util";
import { blake2AsHex } from "@polkadot/util-crypto";

export class FireblocksSigner implements Signer {
  constructor(
    public fireblocks: FireblocksSDK,
    private vaultAccountId: string,
    private txNote?: string,
    private testnet: boolean = false
  ) {}

  public async signRaw({
    data,
    type,
  }: SignerPayloadRaw): Promise<SignerResult> {
    return new Promise(async (resolve) => {
      let prevStatus;
      data = data.length > (256 + 1) * 2 ? blake2AsHex(data) : data;

      const rawMessageData: RawMessageData = {
        messages: [
          {
            content: data.substring(2),
          },
        ],
      };

      const tx: TransactionArguments = {
        operation: TransactionOperation.RAW,
        source: {
          type: PeerType.VAULT_ACCOUNT,
          id: this.vaultAccountId,
        },
        assetId: this.testnet ? "WND" : "DOT",
        extraParameters: { rawMessageData },
        note: this.txNote || "",
      };

      let txId = await this.fireblocks.createTransaction(tx);
      console.log("TXID: " + txId.id);

      console.log("Transaction's status: " + txId.status);
      while (txId.status != TransactionStatus.COMPLETED) {
        if (
          txId.status == TransactionStatus.BLOCKED ||
          txId.status == TransactionStatus.FAILED ||
          txId.status == TransactionStatus.REJECTED ||
          txId.status == TransactionStatus.CANCELLED
        ) {
          throw new Error(
            `The transaction was not completed - status: ${txId.status}`
          );
        }
        prevStatus = txId.status;
        txId = await this.fireblocks.getTransactionById(txId.id);
        if (txId.status != prevStatus) {
          console.log("Transaction's status: " + txId.status);
        }

        setTimeout(() => {}, 4000);
      }

      const signedTx = (await this.fireblocks.getTransactionById(txId.id))
        .signedMessages;
      if (signedTx != undefined) {
        const signature = "0x00" + signedTx[0].signature.fullSig;

        //@ts-ignore
        resolve({ id: 1, signature });
      }
    });
  }
}

export async function sendTransaction(
  fireblocks: FireblocksSDK,
  account: string,
  blocks: number | undefined,
  endpoint: string,
  params: any[],
  vaultAccountId: string,
  txNote: string,
  testnet: boolean,
  proxy?: boolean
): Promise<void> {
  let result;
  const api = await ApiPromise.create({
    provider: new WsProvider(endpoint),
    noInitWarn: true // Suppress API initialization warnings
  });
  const [txName, ...restParams] = params;
  const [section, method] = txName.split(".");
  assert(
    api.tx[section] && api.tx[section][method],
    `Unable to find method ${section}.${method}`
  );

  const options: Partial<SignerOptions> = {
    signer: new FireblocksSigner(fireblocks, vaultAccountId, txNote, testnet),
  };

  if (blocks === 0) {
    // immortal extrinsic
    options.era = 0;
  } else if (!blocks) {
    // Get current block if we want to modify the number of blocks we have to sign
    const signedBlock = await api.rpc.chain.getBlock();
    options.blockHash = signedBlock.block.header.hash;

    // @ts-ignore
    options.era = api.createType("ExtrinsicEra", {
      current: signedBlock.block.header.number,
      period: blocks,
    });
  }

  // if calling from proxy
  if (proxy) {
    const [proxyCall, proxyReal, proxyType, ...proxyCallParams] = restParams;
    const [proxySection, proxyMethod] = proxyCall.split(".");

    // call method as proxy
    try {
      result = api.tx.proxy.proxy(
        proxyReal,
        proxyType,
        proxyCallParams[0]
          ? api.tx[proxySection][proxyMethod](...proxyCallParams)
          : api.tx[proxySection][proxyMethod]()
      );
    } catch (e) {
      console.log(e);
    }
  } else {
    const [_, ...rest] = params;
    result = await api.tx[section][method](...rest);
  }

  result.signAndSend(account, options, (result) => {
    if (result.isInBlock || result.isFinalized) {
      if (result.dispatchError?.isModule) {
        const decoded = api.registry.findMetaError(
          result.dispatchError.asModule
        );
        const { docs, name, section } = decoded;

        console.log(
          `The transaction is submitted to the blockchain but failed with the following error:\n${section}.${name}: ${docs.join(
            " "
          )}`
        );
      }

      console.log("Submitted tx in block:", result.status.toHuman());
      api.disconnect();
    }
  });
}
