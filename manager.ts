import { FireblocksSDK } from "fireblocks-sdk";
import { DOTStaker } from "./src/dot-staker";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const getSecretValue = async (secretName, region) => {
  const client = new SecretsManagerClient({
      region: region,
  });
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    }),
  );

  if (response.SecretString) {
    return response.SecretString;
  }

  if (response.SecretBinary) {
    return response.SecretBinary;
  }
};

(async() => {
    let secretString: any = await getSecretValue("apikey/custodian/fireblocks/sandbox", "ap-south-1");
    let secret = JSON.parse(secretString.replaceAll(/\r?\n|\r/g, "").replaceAll(/\s+/g, "").replaceAll(/,}/g,'}'));
    console.log("First 4 of API key from secrets: " + secret.api_key.substr(0, 4));
    const fireblocks = new FireblocksSDK(secret.private_key, secret.api_key);
    const dotStaker = new DOTStaker(fireblocks, false);
    //const res = await dotStaker.addProxy("2", "proxy_dot_address");
    //console.log(JSON.stringify(res, null, 2));
})().catch(console.log);