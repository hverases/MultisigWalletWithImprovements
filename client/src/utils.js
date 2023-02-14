import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import Wallet from './contracts/Wallet.json';

const getWeb3 = () => {
  return new Promise( async (resolve, reject) => {
    let provider = await detectEthereumProvider();
    if(provider) {
      await provider.request({ method: 'eth_requestAccounts' });
      try {
        window.ethereum.on('accountsChanged', pageReload);
        window.ethereum.on('chainChanged', pageReload);
        const web3 = new Web3(window.ethereum);
        resolve(web3);
      } catch(error) {
        reject(error);
      }
    }
    reject('Install Metamask');
  });
}

const pageReload = () => window.location.reload();

const getWallet = async web3 => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = Wallet.networks[networkId];
  return new web3.eth.Contract(
    Wallet.abi,
    deployedNetwork && deployedNetwork.address,
  );
}

const showRevertMessage = error => {
  let errorObjectString = error.message;
  if (!errorObjectString) return;

  let objBracketPosition = errorObjectString.indexOf('{');
  if (objBracketPosition === -1) return;

  let errorObject = JSON.parse(errorObjectString.slice(objBracketPosition));
  let fullMessage = errorObject.message || errorObject.originalError.message;

  let errorMessage;
  let revertPosition = fullMessage.indexOf('reverted');
  if (revertPosition !== -1) {
    errorMessage = fullMessage.slice(revertPosition + 9);
    alert(errorMessage);
    return;
  }
  else {
    revertPosition = fullMessage.indexOf('revert');
    if (revertPosition !== -1) {   
      errorMessage = fullMessage.slice(revertPosition + 7);
      alert(errorMessage);
      return;
    }
  }
}

export { getWeb3, getWallet, showRevertMessage }; 