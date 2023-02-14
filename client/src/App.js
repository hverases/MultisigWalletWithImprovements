import React, { useEffect, useState } from 'react';
import { getWeb3, getWallet, showRevertMessage } from './utils.js'; 
import Header from './Header.js';
import NewTransfer from './NewTransfer.js';
import TransferList from './TransferList.js';

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [networkType, setNetworkType] = useState(undefined);
  const [wallet, setWallet] = useState(undefined);
  const [approvers, setApprovers] = useState([]);
  const [quorum, setQuorum] = useState(undefined);
  const [transfers, setTransfers] = useState([]);
  const [approvedTransactions, setApprovedTransactions] = useState({});
  const [isApprover, setIsApprover] = useState(false);

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkType = await web3.eth.net.getNetworkType();
      const wallet = await getWallet(web3);
      const approvers = await wallet.methods.getApprovers().call();
      const quorum = await wallet.methods.quorum().call();
      const transfers = await wallet.methods.getTransfers().call();
      const tupleApprovedTransactions = await wallet.methods.getSenderApprovedTransactions().call({from: accounts[0]});
      const approvedTransactions = mapApprovedTransactions(tupleApprovedTransactions);
      setWeb3(web3);
      setAccounts(accounts);
      setNetworkType(networkType);
      setWallet(wallet);
      setApprovers(approvers);
      setQuorum(quorum);
      setTransfers(transfers);
      setApprovedTransactions(approvedTransactions);
      setIsApprover(approvers.includes(accounts[0]));
    };
    init();
  }, []);

  const mapApprovedTransactions = tuple => {
    let transactionsId = tuple['0'];
    let transactionsIsApproved = tuple['1'];
    let approvedTransactions = {};

    for (let i = 0; i < transactionsId.length; i++) {
      approvedTransactions[transactionsId[i]] = transactionsIsApproved[i];
    }

    return approvedTransactions;
  }

  const createTransfer = transfer => {
    callCreateTransfer(transfer, sendCreateTransfer);
  }

  const callCreateTransfer = (transfer, fnSendCreateTransfer) => {
    wallet.methods
      .createTransfer(transfer.amount, transfer.to)
      .call({from: accounts[0]})
      .then(() => fnSendCreateTransfer(transfer))
      .catch(showRevertMessage);
  }

  const sendCreateTransfer = transfer => {
    wallet.methods
      .createTransfer(transfer.amount, transfer.to)
      .send({from: accounts[0]})
      .on('confirmation', async function(confirmationNumber, receipt){
        const transfers = await wallet.methods.getTransfers().call();
        setTransfers(transfers);
      })
      .on('error', async function(error, receipt){
        console.log(error);
        console.log(receipt);
      });
  }

  const approveTransfer = transferId => {
    callApproveTransfer(transferId, sendApproveTransfer);
  }

  const callApproveTransfer = (transferId, fnSendApproveTransfer) => {
    wallet.methods
      .approveTransfer(transferId)
      .call({from: accounts[0]})
      .then(() => fnSendApproveTransfer(transferId))
      .catch(showRevertMessage);
  }

  const sendApproveTransfer = transferId => {
    wallet.methods
      .approveTransfer(transferId)
      .send({from: accounts[0]})
      .on('confirmation', async function(confirmationNumber, receipt){
        const transfers = await wallet.methods.getTransfers().call();
        setTransfers(transfers);
        approvedTransactions[transferId] = true;
        setApprovedTransactions(approvedTransactions);
      })
      .on('error', async function(error, receipt){
        console.log(error);
        console.log(receipt);
      });
  }

  if(
    !web3
    || !accounts
    || !networkType
    || !wallet
    || !approvers
    || !quorum
    || !transfers
    || !approvedTransactions
  ) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      Multisig Dapp 
      <Header connectedAccount={accounts[0]} approvers={approvers} quorum={quorum} />
      <NewTransfer createTransfer={createTransfer} isApprover={isApprover} />
      <TransferList transfers={transfers} approvedTransactions={approvedTransactions} approveTransfer={approveTransfer} isApprover={isApprover} />
    </div>
  );
}

export default App;