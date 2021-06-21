# Fireblocks Polkadot staking 

This script allows to stake DOT via the Fireblocks system using the RAW signing API feature.

**Prerequisites:**
1. Create the following vault accounts with DOT wallet within each:
a. Stash Account - holds the amount to stake
b. Controller Account - has the permissions to nominate validators

2. Enable RAW signing feature by contacting Fireblocks

3. Set transaction authorization policy rule that governs the RAW signing operation, the policy should include the following parameters:
a. Initiator
b. Designated Signer
c. Asset - DOT
d. Source (vault accounts) - Optional
e. Authorizers - Optional

