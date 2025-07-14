
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!userProfile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, ticketData } = await req.json()

    switch (action) {
      case 'create_ticket':
        const { data: newTicket } = await supabase
          .from('tickets')
          .insert({
            user_id: user.id,
            subject: ticketData.subject,
            body: ticketData.body,
            priority: ticketData.priority || 'medium'
          })
          .select()
          .single()

        return new Response(JSON.stringify({ ticket: newTicket }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'get_tickets':
        let query = supabase
          .from('tickets')
          .select(`
            *,
            profiles!tickets_user_id_fkey (
              first_name,
              last_name,
              email
            ),
            assigned_user:profiles!tickets_assigned_to_fkey (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })

        // If not admin, only show user's own tickets
        if (userProfile.role !== 'admin') {
          query = query.eq('user_id', user.id)
        }

        const { data: tickets } = await query

        return new Response(JSON.stringify({ tickets }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'update_ticket':
        // Only admins can update tickets or users can update their own
        if (userProfile.role !== 'admin' && ticketData.user_id !== user.id) {
          return new Response(JSON.stringify({ error: 'Unauthorized to update this ticket' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { data: updatedTicket } = await supabase
          .from('tickets')
          .update({
            status: ticketData.status,
            assigned_to: ticketData.assigned_to
          })
          .eq('id', ticketData.id)
          .select()
          .single()

        return new Response(JSON.stringify({ ticket: updatedTicket }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Support system error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
