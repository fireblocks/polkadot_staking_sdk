import fs from "fs";
import { FireblocksSDK } from "fireblocks-sdk";
import { DOTStaker } from "./src/dot-staker";
import { ProxyTypesEnum } from "./src/types";

const apiSecret = fs.readFileSync("./fireblocks_secret.key", "utf8");
const apiKey = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
const fireblocks = new FireblocksSDK(apiSecret, apiKey);
const dotStaker = new DOTStaker(fireblocks, false);

async function stakeDot() {
  try {
    const addProxyTx = await dotStaker.addProxy(
      "<STASH_VAULT_ACCOUNT_ID",
      "<PROXY_ADDRESS>",
      ProxyTypesEnum.Staking
    );
    console.log(JSON.stringify(addProxyTx, null, 2));

    const bondTx = await dotStaker.bond("<STASH_VAULT_ACCOUNT_ID>");
    console.log(JSON.stringify(bondTx, null, 2));
  } catch (e) {
    console.error(e);
  }
}

stakeDot();
