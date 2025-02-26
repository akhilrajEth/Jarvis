
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { ReclaimProofRequest } from '../$node_modules/@reclaimprotocol/js-sdk/dist/index.js';
 
function VerifyShareCredit() {

  const [requestUrl, setRequestUrl] = useState('');
  const [proofs, setProofs] = useState([]);
 
  const getVerificationReq = async () => {
    const APP_ID = process.env.REACT_APP_RECLAIM_APP_ID;
    const APP_SECRET = process.env.REACT_APP_RECLAIM_APP_SECRET;
    const PROVIDER_ID = process.env.REACT_APP_RECLAIM_PROVIDER_ID;

 
    const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);
 
    const requestUrl = await reclaimProofRequest.getRequestUrl();

    console.log('Request URL:', requestUrl);

    setRequestUrl(requestUrl);
 
    // Start listening for proof submissions
    await reclaimProofRequest.startSession({

      // Called when the user successfully completes the verification
      onSuccess: (proofs) => {

        console.log('Verification success', proofs);
        setProofs(proofs);
        let proofData = JSON.parse(proofs.claimData.context)
        let creditScore = proofData.extractedParameters.text

        if (creditScore > 650){
          console.log("Good Credit")
        }
        else{
          console.log("Bad Credit")
        }
        // Add your success logic here, such as:
        // - Updating UI to show verification success
        // - Storing verification status
        // - Redirecting to another page
      },
      // Called if there's an error during verification
      onError: (error) => {

        console.error('Verification failed', error);
 
        // Add your error handling logic here, such as:
        // - Showing error message to user
        // - Resetting verification state
        // - Offering retry options
      },
    });
  };
 
  return (
    <>
      <button onClick={getVerificationReq}>Get Verification Request</button>

      {/* Display QR code when URL is available */}

      {requestUrl && (
        <div style={{ margin: '20px 0' }}>
          <QRCode value={requestUrl} />
        </div>
      )}

      {proofs && (
        <div>
          <h2>Verification Successful!</h2>
          <pre>{JSON.stringify(proofs, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
 
export default VerifyShareCredit;
