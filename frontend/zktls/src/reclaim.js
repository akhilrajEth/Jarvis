
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk/dist/index.js';
 
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

        const riskRanges = {
          '300-578': { score: "Poor", lp: 20, restakedETH: 80 },
          '579-668': { score: "Fair", lp: 35, restakedETH: 65 },
          '669-738': { score: "Good", lp: 50, restakedETH: 50 },
          '739-798': { score: "Very good", lp: 65, restakedETH: 35 },
          '799-850': { score: "Excellent", lp: 80, restakedETH: 20 }
        };
      
        function getlpllocation(creditScore) {
            for (const [range, data] of Object.entries(riskRanges)) {
                const [min, max] = range.split('-').map(Number);
                if (creditScore >= min && creditScore <= max) {
                    return data;
                }
            }
            return { score: "Invalid score", lp: null, restakedETH: null };
        }
        
        let assetAllocation = getlpllocation(creditScore)

        console.log(`Based on your credit score, rating ${assetAllocation.score}. We recommend a asset split of ${assetAllocation.lp} liquidity pool positions & ${assetAllocation.restakedETH} restaked ETH`)

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
