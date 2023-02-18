# Multisig wallet from "6 Figures Blockchain Developer Course" (Eat The Blocks) with improvements
This is the first smart contract example in the course, using Truffle as local development platform and web3.js (and React) for the frontend.

I think this is a really good example to get started in web3 smart contract development. I could get an idea of the things you can do in a smart contract because at first I was so lost and I didn't really know what a smart contract was or what it could do.

As a brief explanation a smart contract is a class with its contructor, fields, properties and methods, and all data stored in those fields are actually stored in the blockchain. Once the contract is deployed in the blockchain then you can interact with it calling the exposed methods (public or external).

When I finished the course lectures and I had a good understanding about how both smart contract and frontend works, I started to do some improvements, some of them proposed by the course as a challenge and some other ones that I thought would be nice to have.
<br><br>

## Proposed improvements in the course:
### "When we create or approve a transfer, we need to manually refresh the frontend to see the up-do-date data on the UI. That would be better if it could reload automatically. TIP: in `createTransfer()` and `approveTransfer()`, re-fetch `transfers` from smart contract and update the `transfers` state."
<br>I did this by using the 'confirmation' callback on the send method for both createTransfer and approveTransfer transactions:
```
.on('confirmation', async function(confirmationNumber, receipt){...});
```
With the corresponding transaction confirmed I got the updated or better said 'current' transfer list from the smart contract and set it in the frontend using the corresponding setMethod defined in the useState React hook.
It could be a bit slow to update the on screen info, but waiting until confirmation seems the safest choice to me.
<br><br>

### "After we approve a transaction, we can still click on the approve button, even though the smart contract only allows one approval per address for each transfer. We could gray out the approve button after an approval. TIP: after we fetch the list of transfers in `App.js`, we could also fetch the approvals for each transfer, for the current address, and pass this info to the `TransferList` component."
<br>

In order to do this, the fastest and easiest approach would be to return a mapping(uint => bool) by filtering approvals by current user address. But you can not return a mapping type in Solidity, at least outside of a smart contract. So I created a method called 'getSenderApprovedTransactions' where I return two arrays in a tuple, one with all the transaction ids and another with the approval state for that user (msg.sender) for each transaction, both with the same length.

Then in the frontend I created a method called 'mapApprovedTransactions' which takes both arrays and builds a new object with transaction id as property name and approval state for the current user as value, in order to be easily accessed later in a key-value way.

After that it was as easy as passing this object to 'TransferList' component and using its values in the disabled property. And now, if a user has already approved a transaction, the 'Approve' button will be disabled for him.

The 'getSenderApprovedTransactions' method is only called on app startup, so when a transaction is approved, the previous created 'approvedTransactions' object is updated in its confirmation callback.
<br><br>

## Other improvements:
I made other improvements apart from the suggested ones in the course:

### Show smart contract error messages on frontend
I don't know how this works with ethers.js library, but at least with web3.js I found that is not easy to get the error messages returned by a smart contract. By the way, I haven't been able to get any error message when sending a transaction (writing to the blockchain), only when calling it (read only access), so for the approve and create transactions I created a workaround in which I first call() them, here I can get the error object in the promise catch callback in case of failure, and if the call() is succesful I execute the transaction "for real" with the send() method.<br>
It's obvious that this is not the best solution, and it's also pretty inefficient keeping in mind the extra calls, but it works to get error messages defined in smart contracts, giving the user a hint of what's going wrong.

Anyways, the error object returned by the catch callback in the promise method call does not have an attribute containing the "clean" error message string, so I created a function called 'showRevertMessage' that extracts the error message from the error object, removing also the prepended text, which is not the same for the Truffle local development environment and Sepolia testnet, and finally shows a javascript alert with the clean error message.

### Extra changes on React frontend
Connected account address is now shown on screen, and the 'Submit' transaction and 'Approve' transaction buttons are now disabled in case of the connected account is not included in the approvers list.<br>
After these changes there is no chance to error messages to be shown, so to test the previous error messages improvement these changes should be reverted.

### Page refresh on account or network change
When I was testing the frontend for this contract I often switched between different accounts, and whenever I did this I also had to reload the page to update the info shown on screen according to the currently connected account. It happened the same when changing the network, moving between localhost development blockchain and Sepolia testnet.<br>
So I set a page reload function as a callback for the Metamask 'accountsChanged' and 'chainChanged' events to fix it.<br>
Maybe this could be done in a better and a more efficient way updating the React frontend without reloading the whole page, but is quicker, easier and safer this way.

### .secrets.json file
I've added the providerOrUrl attribute to the '.secrets.json' file to keep my Infura endpoint safe, and of course, I added the '.secrets.json' file to the root '.gitignore' to not expose my private keys (despite the related addresses only have funds in the Sepolia testnet) and my providerOrUrl endpoint.

I have also added a fallback mechanism if the '.secrets.json' file doesn't exist. So, as an example, if someone clones the repo and tries to execute the contract, run the tests, or make a deployment to his local blockchain, there will be no errors related with the config in 'truffle-config.js' file.<br>
If '.secrets.json' is not found, then it will load the '.secrets-fallback.json' file, that contains the expected file structure but with empty strings as values, also being useful to know how the actual secrets file should be created.