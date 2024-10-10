export class CallFromProxy {
  vaultAccountId: string;
  method: string;
  realAddress: string;
  proxyType?: string;
  proxyCallParams?: any[];
}

export enum ProxyTypesEnum {
  Any = "Any",
  NonTransfer = "NonTransfer",
  Governance = "Governance",
  Staking = "Staking",
  IdentityJudgement = "IdentityJudgement",
  Auction = "Auction",
  NominationPools = "NominationPools",
}
