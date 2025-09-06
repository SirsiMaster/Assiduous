import React from 'react';
import VerificationStatus from './components/VerificationStatus';

function App() {
  const params = new URLSearchParams(window.location.search);
  const verificationId = params.get('verificationId') || 'demo-verification-id';
  return (
    <div style={{fontFamily:"system-ui", padding:"2rem"}}>
      <h2>Sirsi CBV — Verification</h2>
      <p>Verification ID: {verificationId}</p>
      <VerificationStatus verificationId={verificationId} />
    </div>
  );
}

export default App;
