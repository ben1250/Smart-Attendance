import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Fetch attendance data with user and department details
    const { data, error } = await supabaseClient
      .from('attendance_records')
      .select(`
        id,
        attendance_date,
        attendance_time,
        users (full_name, email),
        departments (name)
      `)
      .order('attendance_date', { ascending: false })

    if (error) throw error

    // Convert to CSV
    const csvHeader = 'Date,Time,Name,Email,Department\n'
    const csvRows = data.map(record => {
      return `${record.attendance_date},${record.attendance_time},${record.users.full_name},${record.users.email},${record.departments.name}`
    }).join('\n')

    const csvContent = csvHeader + csvRows

    return new Response(csvContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attendance_report.csv"'
      },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
