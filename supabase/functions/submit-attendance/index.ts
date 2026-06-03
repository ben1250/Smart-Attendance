import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://esm.sh/zod@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AttendanceSchema = z.object({
  device_fingerprint: z.string(),
  wifi_ssid: z.string().optional(),
  ip_address: z.string(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const body = await req.json()
    const validatedData = AttendanceSchema.parse(body)

    // 1. Get user details and department wifi config
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('id, department_id, device_fingerprint')
      .eq('clerk_user_id', user.id)
      .single()

    if (userDataError) throw userDataError

    // 2. Duplicate detection (same day)
    const today = new Date().toISOString().split('T')[0]
    const { data: existingRecord } = await supabaseClient
      .from('attendance_records')
      .select('id')
      .eq('user_id', userData.id)
      .eq('attendance_date', today)
      .single()

    if (existingRecord) {
      return new Response(JSON.stringify({ error: 'Attendance already submitted for today' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Wi-Fi Validation
    const { data: wifiConfig } = await supabaseClient
      .from('wifi_configurations')
      .select('allowed_ssid')
      .eq('department_id', userData.department_id)
      .eq('active', true)
      .single()

    if (wifiConfig && wifiConfig.allowed_ssid !== validatedData.wifi_ssid) {
      return new Response(JSON.stringify({ error: 'Invalid Wi-Fi network' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Insert Record
    const { error: insertError } = await supabaseClient
      .from('attendance_records')
      .insert({
        user_id: userData.id,
        department_id: userData.department_id,
        ip_address: validatedData.ip_address,
        device_fingerprint: validatedData.device_fingerprint,
        wifi_network: validatedData.wifi_ssid,
      })

    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: 'Attendance recorded successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
