import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://esm.sh/zod@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SettingsSchema = z.object({
  department_id: z.string().uuid(),
  allowed_ssid: z.string().min(1, "SSID cannot be empty"),
  active: z.boolean().default(true)
})

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get current user to verify permissions (must be supervisor or admin)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('id, role, department_id')
      .eq('clerk_user_id', user.id)
      .single()

    if (userDataError || !userData) throw new Error('User profile not found')
    
    // RBAC Check: Only Admin or Department Supervisor of the SAME department
    const body = await req.json()
    const validatedData = SettingsSchema.parse(body)

    if (userData.role !== 'super_admin' && 
       (userData.role !== 'department_supervisor' || userData.department_id !== validatedData.department_id)) {
      throw new Error('Forbidden: You do not have permission to manage these settings')
    }

    // Upsert Wi-Fi Configuration
    const { data, error: upsertError } = await supabaseClient
      .from('wifi_configurations')
      .upsert({
        department_id: validatedData.department_id,
        allowed_ssid: validatedData.allowed_ssid,
        active: validatedData.active
      }, { onConflict: 'department_id' })
      .select()
      .single()

    if (upsertError) throw upsertError

    // Log the action
    await supabaseClient.from('audit_logs').insert({
      user_id: userData.id,
      request_id: requestId,
      action: 'UPDATE_WIFI_SETTINGS',
      endpoint: '/manage-settings',
      status: 200,
      timestamp: timestamp
    })

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Settings updated successfully',
      data 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[${timestamp}] Request ${requestId} failed:`, error.message)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal Server Error',
      request_id: requestId
    }), {
      status: error.message.includes('Forbidden') ? 403 : (error.message.includes('Unauthorized') ? 401 : 400),
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
