// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import axios from "https://deno.land/x/axiod@0.26.2/mod.ts";
import {
  Opportunity,
  EnhancedOpportunity,
  ProtocolOpportunities,
  APRResult,
} from "./types.ts";

import { getKoiFinanceAPR, getPancakeSwapAPR, getSyncSwapAPR, getMaverickAPR } from "./fetch_protocol_baseApr.ts";

const API_BASE_URL = "https://api.merkl.xyz/v4";
const PROTOCOL_MAP: Record<string, string> = {
  maverick: "maverick",
  syncswap: "syncswap",
  koi: "koi",
  "pancakeswap-v3": "pancakeswap",
};

function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Unknown error occurred.");
  }
}

async function fetchOpportunities(): Promise<ProtocolOpportunities | undefined> {
  try {
    const { data } = await axios.get<Opportunity[]>(
      `${API_BASE_URL}/opportunities`,
      {
        params: {
          chainId: 324,
          action: "POOL",
          status: "LIVE",
          limit: 100,
        },
      }
    );

    // Organize the opportunities by protocol(key)
    return data.reduce((acc, opportunity) => {
      const protocolKey = PROTOCOL_MAP[opportunity.protocol.id];
      if (protocolKey) {
        acc[protocolKey] = [...(acc[protocolKey] || []), opportunity];
      }
      return acc;
    }, {} as ProtocolOpportunities);
  } catch (error) {
    handleError(error);
    return undefined;
  }
}

async function enhanceOpportunities(
  opportunities: Opportunity[],
  aprFetcher: (identifiers: string[]) => Promise<APRResult>
): Promise<EnhancedOpportunity[]> {
  if (!opportunities?.length) return [];

  const identifiers = opportunities.map((o) => o.identifier);
  //console.log(identifiers)
  const aprs = await aprFetcher(identifiers);
  return opportunities.map((opportunity) => ({
    ...opportunity,
    baseApr: aprs[opportunity.identifier.toLowerCase()] ?? 0,
  }));
}

async function enhanceMaverickOpportunities(
  opportunities: Opportunity[],
  aprFetcher: (poolPairMap: { [key: string]: string }) => Promise<APRResult>
): Promise<EnhancedOpportunity[]> {
  if (!opportunities?.length) return [];

  const poolPairMap: { [key: string]: string } = {};
  opportunities.forEach((opportunity) => {
    //Construct the pool's pairID by getting just the two tokens in the pool(not the maverick 3rd token)
    const poolTokenAddresses = opportunity.tokens
      .filter((token) => !token.name.includes("Maverick"))
      .map((token) => token.address);
    const pairID = poolTokenAddresses.join("_");
    poolPairMap[opportunity.identifier] = pairID;
  });

  const aprs = await aprFetcher(poolPairMap);

  return opportunities.map((opportunity) => ({
    ...opportunity,
    baseApr: aprs[opportunity.identifier] ?? 0,
  }));
}

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  try {
    const opportunities = await fetchOpportunities()
    if (!opportunities) {
      return new Response(JSON.stringify({ error: "Failed to fetch opportunities" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const [
      koiEnhanced,
      pancakeswapEnhanced,
      syncswapEnhanced,
      maverickEnhanced,
    ] = await Promise.all([
      enhanceOpportunities(opportunities.koi, getKoiFinanceAPR),
      enhanceOpportunities(opportunities.pancakeswap, getPancakeSwapAPR),
      enhanceOpportunities(opportunities.syncswap, getSyncSwapAPR),
      enhanceMaverickOpportunities(opportunities.maverick, getMaverickAPR),
    ])

    const allEnhancedOpportunities = [
      ...koiEnhanced,
      ...pancakeswapEnhanced,
      ...syncswapEnhanced,
      ...maverickEnhanced,
    ]

    const sortedOpportunities = allEnhancedOpportunities.sort(
      (a, b) => b.apr + b.baseApr - (a.apr + a.baseApr)
    )

    console.log("Sorted Opportunities:");
    sortedOpportunities.forEach((opportunity) => {
      const totalAPR = opportunity.apr + opportunity.baseApr;
      console.log(`Base APY: ${opportunity.baseApr.toFixed(2)}%, Opportunity APY: ${opportunity.apr.toFixed(2)}%, Total APR: ${totalAPR.toFixed(2)}%, Deposit Link: ${opportunity.depositUrl}`);
    });

    //Write DB Scheme to Supabase

    return new Response(JSON.stringify(sortedOpportunities), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    handleError(error)
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/zksync-opportunity-finder' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

//Problem: Data from subgraphs etc. can be manipulated in supabase. How to have the API's data
//  attestation get verified in the runtime of Agents deployment(Autonome) Autonome <> Opacity.