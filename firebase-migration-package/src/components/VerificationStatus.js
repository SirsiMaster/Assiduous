import React, { useEffect, useState } from 'react';

// Minimal no-auth fetcher; for a real app, pull from Firestore client or an authenticated API
export default function VerificationStatus({ verificationId }) {
  const [data, setData] = useState({ status: 'LOADING' });

  useEffect(() => {
    // In a real app, use Firebase client SDK to read Firestore doc.
    // Here we just render a placeholder; your existing app can wire Firestore directly.
    setData({ status: 'IN_PROGRESS' });
  }, [verificationId]);

  return (
    <div style={{border:"1px solid #ddd", padding:"1rem", borderRadius:"8px"}}>
      <div>Status: <b>{data.status}</b></div>
      <div style={{opacity:.7, fontSize:14}}>Wire your Firestore client here to read /verifications/{verificationId}</div>
    </div>
  );
}
