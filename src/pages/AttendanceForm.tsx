import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@clerk/clerk-react";
import { Smartphone, MapPin, Wifi, ClipboardCheck, User, Mail, Phone, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const attendanceSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone_number: z.string().optional(),
  role: z.enum(['attachee', 'intern', 'visitor', 'staff', 'member']),
  department_id: z.string().uuid("Invalid department"),
  device_fingerprint: z.string(),
  wifi_ssid: z.string().optional(),
  ip_address: z.string(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export default function AttendanceForm() {
  const { user } = useUser();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [ip, setIp] = useState("");

  const { register, handleSubmit, setValue, reset } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone_number: "",
      role: 'visitor',
      device_fingerprint: "",
      wifi_ssid: "",
      ip_address: "",
    }
  });

  // Autofill Query: Get last submission by device fingerprint or email
  const { data: lastProfile } = useQuery({
    queryKey: ['last-submission', user?.id],
    queryFn: async () => {
      const fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`;
      const { data, error } = await supabase
        .from('attendance_records')
        .select('full_name, email, phone_number, role, department_id')
        .or(`email.eq.${user?.primaryEmailAddress?.emailAddress},device_fingerprint.eq.${fingerprint}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        reset({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          role: data.role as any || 'visitor',
          department_id: data.department_id || "",
        });
      }
      return data;
    },
    enabled: !!supabase,
  });

  useEffect(() => {
    // Fetch IP and device info
    const fetchInfo = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setIp(data.ip);
        setValue('ip_address', data.ip);
        
        // Simple fingerprint: UserAgent + Screen Resolution
        const fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`;
        setValue('device_fingerprint', fingerprint);
      } catch (err) {
        console.error("Failed to fetch info", err);
      }
    };
    fetchInfo();
  }, [setValue]);

  const onSubmit = async (data: AttendanceFormValues) => {
    setLoading(true);
    setStatus(null);
    try {
      // Call Supabase Edge Function
      const { data: response, error } = await supabase.functions.invoke('submit-attendance', {
        body: data,
      });

      if (error) throw error;
      
      setStatus({ type: 'success', message: response.message || 'Attendance recorded!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to submit attendance' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="border-t-8 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ClipboardCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Daily Attendance</CardTitle>
          <CardDescription>
            Submit your attendance for {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <Input {...register("full_name")} placeholder="John Doe" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address
                </label>
                <Input {...register("email")} placeholder="john@example.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </label>
                <Input {...register("phone_number")} placeholder="+254..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Role
                </label>
                <select 
                  {...register("role")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="visitor">Visitor</option>
                  <option value="staff">Staff</option>
                  <option value="intern">Intern</option>
                  <option value="attachee">Attachee</option>
                  <option value="member">Member</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department ID</label>
              <Input {...register("department_id")} placeholder="Enter department UUID" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Smartphone className="w-6 h-6 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Device Recognized</p>
                  <p className="text-xs text-gray-500 truncate">{navigator.userAgent}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <MapPin className="w-6 h-6 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">IP Address</p>
                  <p className="text-xs text-gray-500">{ip || 'Fetching...'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Wi-Fi Network (SSID)
                </label>
                <Input 
                  placeholder="Enter current Wi-Fi name"
                  {...register('wifi_ssid')}
                />
                <p className="text-xs text-gray-500">
                  Required if your department mandates office Wi-Fi connection.
                </p>
              </div>
            </div>

            {status && (
              <div className={cn(
                "p-4 rounded-md text-sm",
                status.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                {status.message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full text-lg h-12" 
              disabled={loading || !ip}
            >
              {loading ? "Submitting..." : "Submit Attendance"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-gray-500">
        Logged in as <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
      </div>
    </div>
  );
}
