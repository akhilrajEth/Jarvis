import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { EnhancedOpportunity } from './types.ts'

const supabaseUrl = "https://nibfafwhlabdjvkzpvuv.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYmZhZndobGFiZGp2a3pwdnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ5MDk3NTUsImV4cCI6MjAyMDQ4NTc1NX0.jWvB1p6VVEgG0sqjjsbL9EXNZpSWZfaAqA3uMCKx5AU"

const supabase = createClient(supabaseUrl, supabaseKey)

export async function upsertOpportunities(opportunities: EnhancedOpportunity[]) {
  const opportunitiesWithUUID = opportunities.map(opp => ({
    ...opp,
    id: crypto.randomUUID()
  }));

  const { data, error } = await supabase
    .from('opportunities')
    .upsert(
      opportunitiesWithUUID.map(opp => ({
        id: opp.id,
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
        pool_address: opp.identifier,
      })),
      { onConflict: 'pool_address', ignoreDuplicates: false}
    );

  if (error) {
    console.error('Error upserting opportunities:', error)
  } else {
    console.log(`Successfully upserted ${data?.length} opportunities`)
    await upsertAgentSubscriptionData(opportunitiesWithUUID);
  }
}

export async function upsertAgentSubscriptionData(opportunities: (EnhancedOpportunity & { id: string })[]) {
  for (const opp of opportunities) {
    const subscriptionData = {
      protocol: opp.protocol.name,
      poolAddress: opp.identifier,
      token0Address: opp.tokens[0].address,
      token1Address: opp.tokens[1].address,
      totalAPR: `${opp.totalAPR}%`
    };

    const { data, error } = await supabase
      .from('agent_subscription_data')
      .upsert({
        id: crypto.randomUUID(),
        opportunity_id: opp.id,
        subscription_data: subscriptionData,
        zk_proof: '', // Add zk_proof if available
        updated_at: new Date().toISOString()
      }, 
      { onConflict: 'opportunity_id' }
    );

    if (error) {
      console.error(`Error upserting agent subscription data for ${opp.protocol.name}:`, error);
    } else {
      console.log(`Successfully upserted agent subscription data for ${opp.protocol.name}`);
    }
  }
}
