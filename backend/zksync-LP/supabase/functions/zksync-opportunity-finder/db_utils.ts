import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { EnhancedOpportunity } from './types.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const supabaseUrl = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")
const supabaseKey = Deno.env.get("LOCAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY")

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or key is missing");
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function upsertOpportunities(opportunities: EnhancedOpportunity[]) {
    console.log("Started upsert process");
    const { data, error } = await supabase.rpc('upsert_opportunities_and_subscription_data', {
        opportunities: opportunities.map(opp => ({
            id: null,
            chain_id: opp.chainId,
            type: opp.type,
            name: opp.name,
            deposit_url: opp.depositUrl,
            status: opp.status,
            action: opp.action,
            tvl: opp.tvl,
            apr: opp.apr,
            daily_rewards: opp.dailyRewards,
            tokens: opp.tokens,
            protocol: opp.protocol.name,
            total_apr: opp.totalAPR,
            pool_address: opp.identifier
        })),
        subscription_data: await Promise.all(opportunities.map(async (opp) => {
            const subscriptionData = {
                protocol: opp.protocol.name,
                poolAddress: opp.identifier,
                token0Address: opp.tokens[0].address,
                token1Address: opp.tokens[1].address,
                totalAPR: `${opp.totalAPR}%`
            };
            const subscriptionDataString = JSON.stringify(subscriptionData);
            const subscriptionDataHash = await hashData(subscriptionDataString);
            return {
                opportunity_id: null,
                subscription_data: subscriptionData,
                subscription_data_hash: subscriptionDataHash,
                updated_at: new Date().toISOString(),
            };
        }))
    });
    console.log("Ended upsert process");

    if (error) {
        console.error('Error upserting opportunities and subscription data:', error);
    } else {
        console.log(`Successfully upserted ${data?.opportunities_affected} opportunities and ${data?.subscription_data_affected} subscription data entries`);
    }
}
