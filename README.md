# Fireblocks Polkadot staking

This script allows to stake DOT via the Fireblocks system using the RAW signing API feature.

## Getting started

1. Clone this repo locally
2. cd into the directory
3. Run:
```
    npm install
```    
4. Make sure that typescript is installed globally:
```
    npm install -g typescript
```
**Prerequisites:**

1. Create the following vault accounts with DOT wallet within each:

    a. Stash Account - holds the amount to stake

    b. Controller Account - has the permissions to run nominations (should have balance of 25 DOT)

2. Enable RAW signing feature by contacting Fireblocks's support team

3. Set transaction authorization policy rule that governs the RAW signing operation, the policy should include the following parameters:

    a. Initiator

    b. Designated Signer

    c. Asset - DOT

    d. Source (vault accounts) - Optional

    e. Authorizers - Optional

**How to stake DOT**

1. addProxy(<controller_account_vault_account_id>, <proxy_dot_address>);

2. bond(<stash_account_vault_account_id>, <amount_to_stake>, <controller_account_address>, **optional** - <reward_destination>);

reward_destination - Can be one of the following:

    1. Stash (Default)

    2. Staked - the rewards are sent back to the Stash and automatically bonded

    3. Controller - the rewards are sent back to the Controller account

**How to stake extra DOT**
1. bondExtra(<stash_account_vault_account_id>, <amount_to_bond>)

**How to stop staking**

1. chill(<controller_account_vault_account_id>);

2. unbond(<controller_account_vault_account_id>, <amount_to_unbond>);

3. **28 days after** unbond() - withdrawUnbonded(<controller_account_vault_account_id>);

4. **Optional** - removeProxy(<controller_account_vault_account_id>, <proxy_dot_address>);

**How to change controller**

1. setController(<stash_vault_account_id>, <controller_address>)

**How to call methods from a proxy account**

*** With the following structure of accounts: ***

1. Stash account:
```
    vaultAccountId = 0
    address = 131AxR1JdcYdtnzT5nqzVRwDJC5GWqP4S8bKpixdMGcwRhhQ
```
2. Controller account:
```
    vaultAccountId = 1
    address = 16Co1rwKf7XdRF8JBBX5uAxP23XZKdXYp5w9pax3zY7t2Kk4
```
3. Proxy account:
```
    vaultAccountId = 2
    address = 14ZGCffp5gMerBPHpC75aM4y5THxfUnDrtFGebGLrQUD2sME
```
*** Following the examples in 'How To Stake DOT', we executed: ***
```
1. addProxy('1', '14ZGCffp5gMerBPHpC75aM4y5THxfUnDrtFGebGLrQUD2sME')
2. bond('0', 100, '16Co1rwKf7XdRF8JBBX5uAxP23XZKdXYp5w9pax3zY7t2Kk4')
```

The 2 operations above set our stash + controller to be ready for staking and the only missing operation is to nominate validators.

Nominate method receives 1 input parameter:
```
    1. nominate(targets: Vec<MultiAddress>) - targets is an array of validator addresses
```
In a case of nominating directly from the controller account (without proxy) the execution should be done using the 'nominate' Fireblocks DOT staking SDK function:

```
    const res = await dotStaker.nominate('1', ['<validator_#1>', '<validator_#2'>...'<validator_#16>])
```

In case of nominating from a proxy account, the exectution should be done using the 'callFromProxy' Fireblocks DOT staking SDK function:

```
    const res = await dotStaker.callFromProxy({
        
        vaultAccountId: "2",
        method: "nominate",
        realAddress: "16Co1rwKf7XdRF8JBBX5uAxP23XZKdXYp5w9pax3zY7t2Kk4",
        proxyCallParams: [
            "<validator_#1>",
            "<validator_#2>",
            .
            .
            .
            "<validator_#16>"
        ]
    })
```

Let's go over the inputs in 'callFromProxy':
```
    'callFromProxy' receives an object with the following properties:

        vaultAccountId - the vault account ID of your proxy account
        method - which method you would like to execute as a proxy (in this example - 'nominate')
        realAddress - address of the controller account that assigned you as a proxy
        proxyCallParams - (optional) array of the parameters that should be passed to the staking method you are executing (in this case an array of validators)

    You can pass an additional optional parameter 'proxyType' - if you defined the proxy type (when adding the proxy from your controller) to a non Staking type. By default set to 'Staking'.

```
