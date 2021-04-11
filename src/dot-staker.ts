import { sendTransaction } from "./Fireblocks-signer";


export  class DOTStaker {
    constructor(public apiClient, public testnet = false) {
    }

    getAssetId () {
        return this.testnet ? 'WND' : 'DOT';
    }

    getEndpoint() {
        return this.testnet ? 'wss://westend-rpc.polkadot.io/' : 'wss://rpc.polkadot.io/';
    }

    async getPermanentAddress(vaultAccountId) {
        var depositAddress = await this.apiClient.getDepositAddresses(vaultAccountId, this.getAssetId());
        return depositAddress[0].address;
    }
    

    async sendTransaction({ vaultAccountId, params, txNote}: {vaultAccountId: string, params: string[], txNote?: string}) {
        const permanentAddress = await this.getPermanentAddress(vaultAccountId);
        return sendTransaction(this.apiClient, permanentAddress, 0, this.getEndpoint(), params , vaultAccountId, txNote);
    }

    async bond(vaultAccountId, amount?: number, controllerAddress?: string) {
        if(!amount) {
            const availableBalance = (await this.apiClient.getVaultAccountAsset(vaultAccountId, this.getAssetId())).available;
            amount = Number.parseFloat(availableBalance);
        } 

        const txNote = controllerAddress ? `Bond ${amount} DOT to ${controllerAddress}` : `Bond ${amount} DOT`;
        console.log(txNote);

        await this.sendTransaction({
            vaultAccountId,
            params: [
                'staking.bond', controllerAddress || await this.getPermanentAddress(vaultAccountId),
                (amount * 10000000000).toString(),
                'Stash'
            ],
            txNote
        });
    }
    
    async bondExtra(vaultAccountId, amount?: number) {
        if(!amount) {
            const availableBalance = await this.apiClient.getVaultAccountAsset(vaultAccountId, this.getAssetId()).available;
            amount = Number.parseFloat(availableBalance);
        }
        await this.sendTransaction({ params: ['staking.bondExtra', (amount * 10000000000).toString()], vaultAccountId, txNote: `Bond extra ${amount} DOT`});
    }
    
    async unbond(vaultAccountId, amount?: number) {
        await this.sendTransaction({params: ['staking.unbond',(amount * 10000000000).toString()], vaultAccountId, txNote: `Unbond ${amount} DOT`});
    }
    
    async addProxy(vaultAccountId, proxyAddress) {
        await this.sendTransaction({params: ['proxy.addProxy', proxyAddress, 'Staking', '0'], vaultAccountId, txNote: `staking.addProxy ${proxyAddress}`});
    }
}
