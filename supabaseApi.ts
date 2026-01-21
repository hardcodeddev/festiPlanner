import { supabase } from './supabaseClient';
import { User, Camp } from './types';
 
// Flag to suppress handling of the next realtime event caused by this client
export const realtimeSuppression = {
  flag: false,
};

export function markLocalUpdate(timeout = 1000) {
  realtimeSuppression.flag = true;
  setTimeout(() => { realtimeSuppression.flag = false; }, timeout);
}

// Helper to convert snake_case DB fields to camelCase TypeScript fields
function dbToCamp(dbCamp: any): Camp {
  return {
    id: dbCamp.id,
    name: dbCamp.name,
    festivalName: dbCamp.festival_name,
    date: dbCamp.date,
    dimensions: dbCamp.dimensions,
    members: dbCamp.members || [],
    objects: dbCamp.objects || [],
    sharedPackingList: dbCamp.shared_packing_list || [],
    imageUrl: dbCamp.image_url,
  };
}

export async function upsertProfile(user: User) {
  // Profiles table should have id = auth.users.id
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: user.name, email: user.email }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data as Array<any>;
}

export async function createCamp(camp: Camp) {
  // Map camelCase to snake_case for Supabase columns
  const dbCamp = {
    id: camp.id,
    name: camp.name,
    festival_name: camp.festivalName,
    date: camp.date,
    dimensions: camp.dimensions,
    members: camp.members,
    objects: camp.objects,
    shared_packing_list: camp.sharedPackingList,
    image_url: camp.imageUrl,
  };
  const { data, error } = await supabase.from('camps').insert(dbCamp).select().single();
  if (error) throw error;
  return dbToCamp(data) as Camp;
}

export async function updateCamp(camp: Camp) {
  // Map camelCase to snake_case for Supabase columns
  const dbCamp = {
    id: camp.id,
    name: camp.name,
    festival_name: camp.festivalName,
    date: camp.date,
    dimensions: camp.dimensions,
    members: camp.members,
    objects: camp.objects,
    shared_packing_list: camp.sharedPackingList,
    image_url: camp.imageUrl,
  };
  const { data, error } = await supabase.from('camps').update(dbCamp).eq('id', camp.id).select().single();
  if (error) throw error;
  return data as Camp;
}

export async function fetchCampsForUser(userId: string) {
  const { data, error } = await supabase
    .from('camps')
    .select('*')
    .contains('members', [userId]);
  if (error) throw error;
  // Map snake_case back to camelCase
  return (data || []).map((c: any) => {
    const packingList = Array.isArray(c.shared_packing_list) && c.shared_packing_list.length > 0 
      ? c.shared_packing_list 
      : [
          { id: 'default-1', name: 'Main Canopy', quantity: 1, isPrivate: false, category: 'Logistics' },
          { id: 'default-2', name: 'Large Cooler', quantity: 2, isPrivate: false, category: 'Kitchen' },
          { id: 'default-3', name: 'First Aid Kit', quantity: 1, isPrivate: false, category: 'General' }
        ];
    console.log(`Camp ${c.id} (${c.name}) shared_packing_list:`, c.shared_packing_list, '→ Using:', packingList);
    return {
      id: c.id,
      name: c.name,
      festivalName: c.festival_name,
      date: c.date,
      dimensions: c.dimensions || { width: 30, height: 30 },
      members: c.members || [],
      objects: c.objects || [],
      sharedPackingList: packingList,
      imageUrl: c.image_url,
    } as Camp;
  });
}

export async function createInvitation(inviterId: string, email: string, campId?: string) {
  const token = Math.random().toString(36).slice(2, 12);
  // Ensure inviter profile exists to satisfy the foreign key constraint
  try {
    await supabase.from('profiles').upsert({ id: inviterId }, { onConflict: 'id' });
  } catch (e) {
    // If upsert fails, continue — insert may still fail due to FK and will be handled below
    console.warn('Failed to upsert inviter profile (continuing):', e);
  }
  // If an invitation already exists for this email+camp, return it instead of creating a duplicate
  if (campId) {
    const { data: existing } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('camp_id', campId)
      .maybeSingle();
    if (existing) {
      const link = `https://hardcodeddev.github.io/festiPlanner/?invite=${existing.token}&email=${encodeURIComponent(email)}`;
      return { ...existing, link, emailSent: false, emailError: 'Invite already exists' };
    }
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({ inviter_id: inviterId, email, token, accepted: false, camp_id: campId })
    .select()
    .single();
  if (error) throw error;
  // Return a simple invite link for the app; the app should accept token and email to claim membership.
  const link = `https://hardcodeddev.github.io/festiPlanner/?invite=${data.token}&email=${encodeURIComponent(email)}`;
  // Optionally send email via EmailJS (client-side friendly public key)
  let emailSent = false;
  let emailError: string | null = null;
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
    const userId = import.meta.env.VITE_EMAILJS_USER_ID as string | undefined;
    if (serviceId && templateId && userId) {
      const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: userId,
          template_params: {
            to_email: email,
            invite_link: link,
          }
        })
      });
      if (!resp.ok) {
        // Try to parse JSON error body, fallback to text
        const text = await resp.text().catch(() => 'Unknown error');
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = null;
        }
        if (parsed && (parsed.error || parsed.message)) {
          emailError = `Email service ${resp.status}: ${parsed.error || parsed.message}`;
        } else {
          emailError = `Email service ${resp.status}: ${text}`;
        }
        console.error('EmailJS send failed', { status: resp.status, body: emailError });
      } else {
        emailSent = true;
      }
    }
  } catch (e: any) {
    emailError = e?.message || String(e);
  }

  return { ...data, link, emailSent, emailError };
}

export async function acceptInvitation(token: string, email: string, userId: string) {
  const { data: invite, error: findErr } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('email', email)
    .single();
  if (findErr) throw findErr;

  // Mark accepted
  const { data: updated, error: updErr } = await supabase
    .from('invitations')
    .update({ accepted: true, accepted_by: userId })
    .eq('id', invite.id)
    .select()
    .single();
  if (updErr) throw updErr;

  // If invite targeted a camp, add the user to that camp's members array (if not already)
  if (invite.camp_id) {
    const { data: campData, error: campErr } = await supabase
      .from('camps')
      .select('*')
      .eq('id', invite.camp_id)
      .single();
    if (campErr) {
      console.warn('Failed to fetch camp for invitation acceptance', campErr);
      return updated;
    }

    const members: string[] = campData?.members || [];
    if (!members.includes(userId)) {
      const newMembers = [...members, userId];
      const { error: addErr } = await supabase.from('camps').update({ members: newMembers }).eq('id', invite.camp_id);
      if (addErr) console.warn('Failed to add invited user to camp members', addErr);
    }
  }

  return updated;
}

export async function fetchPendingInvitationsForInviter(inviterId: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('inviter_id', inviterId)
    .eq('accepted', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Array<any>;
}

export async function resendInvitation(inviteId: number) {
  const { data: invite, error: findErr } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', inviteId)
    .single();
  if (findErr) throw findErr;

  const link = `${window.location.origin}/?invite=${invite.token}&email=${encodeURIComponent(invite.email)}`;
  let emailSent = false;
  let emailError: string | null = null;

  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
    const userId = import.meta.env.VITE_EMAILJS_USER_ID as string | undefined;
    if (serviceId && templateId && userId) {
      const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: userId,
          template_params: { to_email: invite.email, invite_link: link }
        })
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Unknown error');
        let parsed: any = null;
        try { parsed = JSON.parse(text); } catch(e) { parsed = null; }
        if (parsed && (parsed.error || parsed.message)) {
          emailError = `Email service ${resp.status}: ${parsed.error || parsed.message}`;
        } else {
          emailError = `Email service ${resp.status}: ${text}`;
        }
      } else {
        emailSent = true;
      }
    } else {
      emailError = 'EmailJS not configured';
    }
  } catch (e: any) {
    emailError = e?.message || String(e);
  }

  return { invite, link, emailSent, emailError };
}

export default {
  upsertProfile,
  fetchProfiles,
  createCamp,
  updateCamp,
  fetchCampsForUser,
  createInvitation,
  acceptInvitation,
};
