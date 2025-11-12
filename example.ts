import fs from "fs";
import { FireblocksSDK } from "fireblocks-sdk";
import { DOTStaker } from "./src/dot-staker";

const apiSecret = fs.readFileSync("./fireblocks_secret.key", "utf8");
const apiKey = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
const fireblocks = new FireblocksSDK(apiSecret, apiKey);
const dotStaker = new DOTStaker(fireblocks, false);

async function stakeDot() {
  try {
    console.log("Starting bond operation...");
    await dotStaker.bond("0", 1);
  } catch (e) {
    console.error("Bond operation failed:", e);
  }
}

stakeDot();
