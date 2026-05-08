import { supabase } from '@/integrations/supabase/client';

export interface RotatorLink {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export interface RotatorDestination {
  id: string;
  rotator_id: string;
  url: string;
  label: string;
  weight: number;
  created_at: string;
}

export interface RotatorStats {
  destination_id: string;
  label: string;
  url: string;
  weight: number;
  clicks: number;
  checkouts: number;
  purchases: number;
  revenue: number;
  avg_ticket: number;
  conversion_rate: number;
  checkout_rate: number;
}

export const rotatorApi = {
  async getAll(): Promise<RotatorLink[]> {
    const { data, error } = await (supabase as any)
      .from('rotator_links')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(name: string, slug: string): Promise<RotatorLink> {
    const { data, error } = await (supabase as any)
      .from('rotator_links')
      .insert({ name, slug })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('rotator_links')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getDestinations(rotatorId: string): Promise<RotatorDestination[]> {
    const { data, error } = await (supabase as any)
      .from('rotator_destinations')
      .select('*')
      .eq('rotator_id', rotatorId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addDestination(rotatorId: string, url: string, label: string, weight: number): Promise<RotatorDestination> {
    const { data, error } = await (supabase as any)
      .from('rotator_destinations')
      .insert({ rotator_id: rotatorId, url, label, weight })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeDestination(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('rotator_destinations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getStats(rotatorId: string): Promise<RotatorStats[]> {
    const { data: destinations } = await (supabase as any)
      .from('rotator_destinations')
      .select('*')
      .eq('rotator_id', rotatorId);

    if (!destinations) return [];

    const { data: clicks } = await (supabase as any)
      .from('rotator_clicks')
      .select('id, destination_id, click_id')
      .eq('rotator_id', rotatorId);

    const clickIds = (clicks || []).map((c: any) => c.click_id);
    let events: any[] = [];
    if (clickIds.length > 0) {
      const { data: eventsData } = await (supabase as any)
        .from('rotator_events')
        .select('*')
        .in('click_id', clickIds);
      events = eventsData || [];
    }

    return destinations.map((dest: any) => {
      const destClicks = (clicks || []).filter((c: any) => c.destination_id === dest.id);
      const destClickIds = destClicks.map((c: any) => c.click_id);
      const destEvents = events.filter((e: any) => destClickIds.includes(e.click_id));
      const checkouts = destEvents.filter((e: any) => e.event_type === 'checkout').length;
      const purchases = destEvents.filter((e: any) => e.event_type === 'purchase');
      const revenue = purchases.reduce((sum: number, e: any) => sum + (parseFloat(e.value) || 0), 0);

      return {
        destination_id: dest.id,
        label: dest.label,
        url: dest.url,
        weight: dest.weight,
        clicks: destClicks.length,
        checkouts,
        purchases: purchases.length,
        revenue,
        avg_ticket: purchases.length > 0 ? revenue / purchases.length : 0,
        conversion_rate: destClicks.length > 0 ? (purchases.length / destClicks.length) * 100 : 0,
        checkout_rate: destClicks.length > 0 ? (checkouts / destClicks.length) * 100 : 0,
      };
    });
  },

  async getTotalStats(rotatorId: string) {
    const stats = await this.getStats(rotatorId);
    const totalClicks = stats.reduce((s, d) => s + d.clicks, 0);
    const totalCheckouts = stats.reduce((s, d) => s + d.checkouts, 0);
    const totalPurchases = stats.reduce((s, d) => s + d.purchases, 0);
    const totalRevenue = stats.reduce((s, d) => s + d.revenue, 0);

    return {
      stats,
      totals: {
        clicks: totalClicks,
        checkouts: totalCheckouts,
        purchases: totalPurchases,
        revenue: totalRevenue,
        avg_ticket: totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
        conversion_rate: totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0,
        checkout_rate: totalClicks > 0 ? (totalCheckouts / totalClicks) * 100 : 0,
      },
    };
  },

  getRedirectUrl(slug: string): string {
    return `${window.location.origin}/r/${slug}`;
  },

  getTrackingPixelSnippet(slug: string): string {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/rotator-track`;
    return `<!-- BXMetrics Tracking Pixel -->
<script>
(function(){
  var params = new URLSearchParams(window.location.search);
  var clickId = params.get('cm_click');
  if (!clickId) return;
  window.CM_CLICK_ID = clickId;
  window.cmTrack = function(eventType, value) {
    fetch('${baseUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ click_id: clickId, event_type: eventType, value: value || 0 })
    });
  };
})();
</script>

<!-- Call on checkout page: -->
<!-- <script>cmTrack('checkout');</script> -->

<!-- Call on thank you page with purchase value: -->
<!-- <script>cmTrack('purchase', 97.00);</script> -->`;
  },
};
