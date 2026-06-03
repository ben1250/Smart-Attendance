import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://esm.sh/zod@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SubmissionSchema = z.object({
  form_id: z.string().uuid(),
  full_name: z.string().min(2),
  email: z.string().email(),
  phone_number: z.string().optional(),
  role: z.enum(['attachee', 'intern', 'visitor', 'staff', 'member']),
  department_id: z.string().uuid(),
  device_fingerprint: z.string(),
  wifi_ssid: z.string().optional(),
  ip_address: z.string(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const requestId = crypto.randomUUID()
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const body = await req.json()
    const data = SubmissionSchema.parse(body)

    // 1. Validate Form Status
    const { data: form, error: formError } = await supabaseClient
      .from('attendance_forms')
      .select('is_active')
      .eq('id', data.form_id)
      .single()

    if (formError || !form?.is_active) throw new Error('Form is no longer active')

    // 2. Duplicate detection (Same user, same form, same day)
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabaseClient
      .from('attendance_records')
      .select('id')
      .eq('form_id', data.form_id)
      .eq('email', data.email)
      .eq('attendance_date', today)
      .maybeSingle()

    if (existing) throw new Error('You have already submitted this form today')

    // 3. Wi-Fi Validation
    const { data: wifi } = await supabaseClient
      .from('wifi_configurations')
      .select('allowed_ssid')
      .eq('department_id', data.department_id)
      .eq('active', true)
      .maybeSingle()

    if (wifi && wifi.allowed_ssid !== data.wifi_ssid) {
      throw new Error(`Please connect to the office Wi-Fi (${wifi.allowed_ssid}) to submit`)
    }

    // 4. Insert Record & Update/Create User Profile (Autofill support)
    const { error: insertError } = await supabaseClient
      .from('attendance_records')
      .insert({
        form_id: data.form_id,
        user_id: (await supabaseClient.auth.getUser()).data.user?.id, // Optional link
        department_id: data.department_id,
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number,
        role: data.role,
        ip_address: data.ip_address,
        device_fingerprint: data.device_fingerprint,
        wifi_network: data.wifi_ssid,
        request_id: requestId
      })

    if (insertError) throw insertError

    return new Response(JSON.stringify({ success: true, message: 'Attendance recorded' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
