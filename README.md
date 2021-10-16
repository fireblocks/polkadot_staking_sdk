# Fireblocks Polkadot staking 

This script allows to stake DOT via the Fireblocks system using the RAW signing API feature.

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

2. bond(<stash_account_vault_account_id>, <controller_account_address>, **optional** - <reward_destination>);

reward_destination - Can be one of the following:

    1. Stash (Default)

    2. Staked - the rewards are sent back to the Stash and automatically bonded

    3. Controller - the rewards are sent back to the Controller account

**How to stake extra DOT**
1. bondExtra(<stash_account_vault_account_id>, <amount_to_bond>)

**How to stop staking**

1. If you want to unbond the **entire bonded** balance, run first: chill(<controller_account_vault_account_id>);

2. unbond(<controller_account_vault_account_id>, <amount_to_unbond>);

3. **28 days after** unbond() - withdrawUnbonded(<controller_account_vault_account_id>);

4. **Optional** - removeProxy(<controller_account_vault_account_id>);
