# Fireblocks Polkadot staking

This script allows to stake DOT via the Fireblocks system using the RAW signing API feature.

## :warning: Important Updates :warning:

### Asset Hub Migration (November 2024)

**All staking operations now happen on Polkadot Asset Hub, not the Relay Chain.**

After the November 2024 migration:
- ✅ Staking operations (bond, unbond, nominate, chill, etc.) execute on **Asset Hub**
- ✅ DOT balances remain on **Asset Hub**
- ✅ **No cross-chain transfers needed** for staking
- ℹ️  The SDK automatically connects to the correct endpoint (Asset Hub)

### Breaking Change in 2.0.0

Version 2.0.0 introduces a breaking change; as per [this forum post](https://forum.polkadot.network/t/staking-controller-deprecation-plan-staking-ui-leads-comms/2748) on Polkadot - the controller is being deprecated.<br>
As a result the following breaking changes were introduced:

- The function `setController` will no longer work and will results in an error
- The function `bond` no longer accepts 4 arguments, instead only 3 arguments - `vaultAccountId: string, amount?: number, rewardDestination?: string` (the `controller` argument was removed)

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

b. (optional) Proxy account - for security reasons, will get permission to sign staking operations on behalf of the stash

2. Enable RAW signing feature by contacting Fireblocks's support team

3. Set transaction authorization policy rule that governs the RAW signing operation, the policy should include the following parameters:

   a. Initiator

   b. Designated Signer

   c. Asset - DOT

   d. Source (vault accounts) - Optional

   e. Authorizers - Optional

**How to stake DOT**

1. addProxy(<stash_account_vault_account_id>, <proxy_dot_address>);

2. bond(<stash_account_vault_account_id>, <amount_to_stake>, <stash_account_address>, **optional** - <reward_destination>);

reward_destination - Can be one of the following:

    1. Stash (Default)

    2. Staked - the rewards are sent back to the Stash and automatically bonded

**How to stake extra DOT**

1. bondExtra(<stash_account_vault_account_id>, <amount_to_bond>)

**How to stop staking**

1. chill(<vault_account_id>); // stash or proxy

2. unbond(<vault_account_id>, <amount_to_unbond>);

3. **28 days after** unbond() - withdrawUnbonded(<vault_account_id>);

4. **Optional** - removeProxy(<vault_account_id>, <proxy_dot_address>);

**How to change controller**

1. setController(<stash_vault_account_id>, <controller_address>) // Deprecated, see update above

**How to call methods from a proxy account**

**_With the following structure of accounts:_**

1. Stash account:

```
    vaultAccountId = 0
    address = 131AxR1JdcYdtnzT5nqzVRwDJC5GWqP4S8bKpixdMGcwRhhQ
```

```

2. Proxy account:

```

    vaultAccountId = 2
    address = 14ZGCffp5gMerBPHpC75aM4y5THxfUnDrtFGebGLrQUD2sME

```

**_Following the examples in 'How To Stake DOT', we executed:_**

```

1. addProxy('1', '14ZGCffp5gMerBPHpC75aM4y5THxfUnDrtFGebGLrQUD2sME')
2. bond('0', 100, '16Co1rwKf7XdRF8JBBX5uAxP23XZKdXYp5w9pax3zY7t2Kk4')

```

```
