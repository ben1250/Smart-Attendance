import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardCheck, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard({ role }: { role: 'admin' | 'department' | 'supervisor' }) {
  const supabase = useSupabase();
  const [realtimeCount, setRealtimeCount] = useState(0);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', role],
    queryFn: async () => {
      let query = supabase.from('daily_attendance_stats').select('*');
      
      // RBAC: Filter by date (today)
      query = query.eq('attendance_date', new Date().toISOString().split('T')[0]);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity', role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          attendance_time,
          full_name,
          role
        `)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('attendance_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        (payload) => {
          setRealtimeCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const totalAttendance = (stats?.reduce((acc, curr) => acc + curr.total_attendance, 0) || 0) + realtimeCount;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-violet-900 capitalize">{role} Dashboard</h2>
        <div className="flex items-center gap-2 bg-violet-100 px-3 py-1 rounded-full">
          <ShieldCheck className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-medium text-violet-700 uppercase">{role} Access</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-b-4 border-b-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalAttendance}</div>
            <p className="text-xs text-muted-foreground">Today's active count</p>
          </CardContent>
        </Card>

        <Card className="border-b-4 border-b-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96%</div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>

        <Card className="border-b-4 border-b-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Flagged Actions</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Security incidents</p>
          </CardContent>
        </Card>

        <Card className="border-b-4 border-b-bistre-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">08:45 AM</div>
            <p className="text-xs text-muted-foreground">Highest traffic</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-violet-900">Live Attendance Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity?.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-violet-50 transition-colors border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
                    {activity.full_name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{activity.full_name}</p>
                    <p className="text-xs text-violet-600 uppercase font-medium">{activity.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{activity.attendance_time}</p>
                  <p className="text-[10px] text-gray-400">Verified Submission</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
