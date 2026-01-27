import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user's auth to get their ID
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Deleting account for user:', userId);

    // Admin client for elevated operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all user data from tables
    console.log('Deleting user data from tables...');

    // Delete team_players entries
    const { error: teamPlayersError } = await supabaseAdmin
      .from('team_players')
      .delete()
      .eq('user_id', userId);
    if (teamPlayersError) console.error('Error deleting team_players:', teamPlayersError);

    // Delete notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (notificationsError) console.error('Error deleting notifications:', notificationsError);

    // Delete group invites (both as inviter and invitee)
    const { error: groupInvitesError } = await supabaseAdmin
      .from('group_invites')
      .delete()
      .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`);
    if (groupInvitesError) console.error('Error deleting group_invites:', groupInvitesError);

    // Delete group memberships
    const { error: groupMembersError } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('user_id', userId);
    if (groupMembersError) console.error('Error deleting group_members:', groupMembersError);

    // Delete friendships (both as requester and addressee)
    const { error: friendshipsError } = await supabaseAdmin
      .from('friendships')
      .delete()
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (friendshipsError) console.error('Error deleting friendships:', friendshipsError);

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    if (profileError) console.error('Error deleting profile:', profileError);

    // Delete the auth user using admin API
    console.log('Deleting auth user...');
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete auth user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully deleted user account:', userId);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
