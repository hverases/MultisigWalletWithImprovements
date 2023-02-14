import React from 'react';

function Header({connectedAccount, approvers, quorum}) {
  return (
    <header>
      <ul>
        <li>Connected account: {connectedAccount}</li>
        <li>Approvers: {approvers.join(', ')}</li>
        <li>Quorum: {quorum}</li>
      </ul>
    </header>
  );
}

export default Header;