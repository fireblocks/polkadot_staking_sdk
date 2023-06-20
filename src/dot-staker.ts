import { sendTransaction } from "./Fireblocks-signer";
import { CallFromProxy } from "./types";


export class DOTStaker {
    constructor(
        private apiClient, 
        private testnet = false,
        private availableBalance: any = 0
        ){}

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

    private async refreshBalance(vaultAccountId: string) {
        console.log(`Going to refresh the balance in vault ${vaultAccountId}`)
        await this.apiClient.refreshVaultAssetBalance(vaultAccountId, this.getAssetId())
    }
    
    private async getAvailableBalance(vaultAccountId: string): Promise<string> {
        
        return (await this.apiClient.getVaultAccountAsset(vaultAccountId, this.getAssetId())).available        
    }
    

    private async sendTransaction({ 
            vaultAccountId, 
            params, 
            txNote,
            proxy
        }: {
            vaultAccountId: string, 
            params: any[], 
            txNote?: string, 
            proxy?: boolean,
        }) {
        
        const permanentAddress = await this.getPermanentAddress(vaultAccountId);
        
        return sendTransaction(
            this.apiClient, 
            permanentAddress, 0, 
            this.getEndpoint(), 
            params , 
            vaultAccountId, 
            txNote, 
            this.testnet,
            proxy? true: false,
        );
    }


    /**
     * Bond an amount of DOT from the stash to the controller
     * @param vaultAccountId - Stash vault account ID
     * @param amount - the amount to bond (Default is the entire available balance)
     * @param controllerAddress - the controller's address
     * @param rewardDestination - rewards destination (Stash, Staked or Controller)
     */
    public async bond(vaultAccountId: string, amount?: number, controllerAddress?: string, rewardDestination?: string) {
        
        if(!amount) {
            await this.refreshBalance(vaultAccountId)
            this.availableBalance = Number.parseFloat(
                await this.getAvailableBalance(vaultAccountId) as unknown as string)
        } 

        const amountToBond = amount ? amount : this.availableBalance;
        
        const txNote = controllerAddress ? `Bond ${amountToBond} DOT to ${controllerAddress}` : `Bond ${amountToBond} DOT`;

        await this.sendTransaction({
            vaultAccountId,
            params: [
                'staking.bond', controllerAddress || await this.getPermanentAddress(vaultAccountId),
                (this.testnet? amountToBond * 1000000000000 : amountToBond * 10000000000).toString(),
                rewardDestination? rewardDestination: 'Stash'
            ],
            txNote
        });
    }
    

    /**
     * Rebond unbonding amount
     * @param vaultAccountId - controller vault account
     * @param amount - amount to rebond
     */
     public async rebond(vaultAccountId: string, amount: number){
        await this.sendTransaction({
            params: 
                [
                    'staking.rebond', 
                    (this.testnet? amount * 1000000000000 : amount * 10000000000).toString()
                ], 
                vaultAccountId, 
                txNote: `Rebonding ${amount} DOT`
            } 
        )
    }


    /**
     * Bond an extra amount from the stash to the controller (after running bond())
     * @param vaultAccountId - stash vault account id
     * @param amount - (optional) amount to bond extra. The entire available balance by default.
     */
    public async bondExtra(vaultAccountId: string, amount?: number) {
        
        if(!amount) {
            await this.refreshBalance(vaultAccountId)
            this.availableBalance = Number.parseFloat(
                await this.getAvailableBalance(vaultAccountId) as unknown as string);
        }
        const amountToBond = amount ? amount : this.availableBalance;

        await this.sendTransaction({ 
            params: [
                'staking.bondExtra', 
                (this.testnet? amountToBond * 1000000000000 : amountToBond * 10000000000).toString()
            ], 
            vaultAccountId, 
            txNote: `Bond extra ${amountToBond} DOT`});
    }
    

    /**
     * Unbond bonded DOT - can be executed after chill(). Signed by the controller.
     * @param vaultAccountId - controller vault account id
     * @param amount - amount to unbond
     */
    public async unbond(vaultAccountId: string, amount: number) {
        
        await this.sendTransaction({
            params: [
                'staking.unbond',
                (this.testnet? amount * 1000000000000 : amount * 10000000000).toString()
            ], 
            vaultAccountId, 
            txNote: `Unbonding ${amount} DOT`});
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
     * Chill the controller account before unbonding
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
     * 28 days after unbond - releases the unbonded funds
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


    /**
     * Nominate validators for the bonded amount
     * @param vaultAccountId - controller vault account
     * @param validators - array of validators (up to 16)
     */
    public async nominate(vaultAccountId: string, validators: any[]){
        await this.sendTransaction({
            params: 
                [
                    'staking.nominate', 
                    validators
                ], 
                vaultAccountId, 
                txNote: `Nominating validators: ${validators}`
            }
        )
    }


    /**
     * Execute a staking operation if you are an allowed proxy, Possible methods to execute can be found in here:
     * https://polkadot.js.org/docs/substrate/extrinsics#staking
     * @param args: CallFromProxy: 
     *      @param vaultAccountId - proxy vault account ID
     *      @param method - staking method to execute
     *      @param realAddress - the original address that is proxied
     *      @param proxyType - the originally assigned proxy type (default is 'Staking')
     *      @param proxyCallParams - the relevant method params or empty array by default 
     */

    public async callFromProxy(args: CallFromProxy){
    
        await this.sendTransaction({
            params:
                [
                    'proxy.proxy',
                    `staking.${args.method.toLowerCase()}`,
                    args.realAddress,
                    args.proxyType? args.proxyType : 'Staking',
                    args.proxyCallParams? args.proxyCallParams: false
                ],
                vaultAccountId: args.vaultAccountId,
                proxy: true,
                txNote: `Executing ${args.method} as proxy`
            }
        )
    }
}
