import { sendTransaction } from "./Fireblocks-signer";


export class DOTStaker {
    constructor(
        private apiClient, 
        private testnet = false) 
    {}

    private getAssetId () {
        return this.testnet ? 'WND' : 'DOT';
    }

    private getEndpoint() {
        return this.testnet ? 'wss://westend-rpc.polkadot.io/' : 'wss://rpc.polkadot.io/';
    }

    private async getPermanentAddress(vaultAccountId) {
        var depositAddress = await this.apiClient.getDepositAddresses(vaultAccountId, this.getAssetId());
        return depositAddress[0].address;
    }
    

    private async sendTransaction({ vaultAccountId, params, txNote}: {vaultAccountId: string, params: string[], txNote?: string}) {
        const permanentAddress = await this.getPermanentAddress(vaultAccountId);
        return sendTransaction(this.apiClient, permanentAddress, 0, this.getEndpoint(), params , vaultAccountId, txNote, this.testnet);
    }


    /**
     * Bond an amount of DOT from the stash to the controller
     * @param vaultAccountId - Stash vault account ID
     * @param amount - the amount to bond
     * @param controllerAddress - the controller's address
     * @param rewardDestination - rewards destination (Stash, Staked or Controller)
     */
    public async bond(vaultAccountId: string, amount?: number, controllerAddress?: string, rewardDestination?: string) {
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
                (this.testnet? amount * 1000000000000 : amount * 10000000000).toString(),
                rewardDestination? rewardDestination: 'Stash'
            ],
            txNote
        });
    }
    
    /**
     * Bond an extra amount from the stash to the controller (after running bond())
     * @param vaultAccountId - stash vault account id
     * @param amount - amount to bond extra
     */
    public async bondExtra(vaultAccountId: string, amount?: number) {
        if(!amount) {
            const availableBalance = await this.apiClient.getVaultAccountAsset(vaultAccountId, this.getAssetId()).available;
            amount = Number.parseFloat(availableBalance);
        }
        await this.sendTransaction({ 
            params: [
                'staking.bondExtra', 
                (this.testnet? amount * 1000000000000 : amount * 10000000000).toString()
            ], 
            vaultAccountId, 
            txNote: `Bond extra ${amount} DOT`});
    }
    
    /**
     * Unbond bonded DOT - can be executed after chill(). Signed by the controller.
     * @param vaultAccountId - controller vault account id
     * @param amount - amount to unbond
     */
    public async unbond(vaultAccountId: string, amount?: number) {
        await this.sendTransaction({
            params: [
                'staking.unbond',
                (this.testnet? amount * 1000000000000 : amount * 10000000000).toString()
            ], 
            vaultAccountId, 
            txNote: `Unbonding ${amount? amount : "the entire staked"} DOT`});
    }
    
    /**
     * Add proxy to your controller so it will have the permissions to nominate validators
     * @param vaultAccountId - controller vault account id
     * @param proxyAddress - DOT proxy address 
     */
    public async addProxy(vaultAccountId: string, proxyAddress: string) {
        await this.sendTransaction({params: ['proxy.addProxy', proxyAddress, 'Staking', '0'], vaultAccountId, txNote: `Adding the following proxy: ${proxyAddress}`});
    }

    /**
     * Chill the controller accound before unbonding
     * @param vaultAccountId - controller vault account id 
     */
    public async chill(vaultAccountId: string) {
        await this.sendTransaction({params: ['staking.chill'], vaultAccountId, txNote: `Chilling the controller account`});
    }

    /**
     * Remove the previously added proxy address
     * @param vaultAccountId - controller vault account id
     * @param proxyAddress - added proxy address
     * @param proxyType - proxy type (default: 'Staking')
     */
    public async removeProxy(vaultAccountId: string, proxyAddress: string, proxyType?: string) {
        await this.sendTransaction({params: ['proxy.removeProxy', proxyAddress, proxyType? proxyType: 'Staking', '0'], vaultAccountId, txNote: `Removing the following proxy: ${proxyAddress}`});
    }

    /**
     * 28 days after unbond() - releases the unbonded funds
     * @param vaultAccountId - controller vault account id
     */
    public async withdrawUnbonded(vaultAccountId: string) {
        await this.sendTransaction({params: ['staking.withdrawUnbonded', null], vaultAccountId, txNote: `Withdrawing Unbonded Funds`});
    }
    
    /**
     * Change the controller account
     * @param vaultAccountId - stash vault account id
     * @param controllerAddress - new controller address
     */
    public async setController(vaultAccountId: string, controllerAddress: string){
        await this.sendTransaction({params: ['staking.setController', controllerAddress], vaultAccountId, txNote: `Setting ${controllerAddress} as contoller`})
    }
}
