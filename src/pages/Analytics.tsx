import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ExportButton from "@/components/ExportButton";

export default function Analytics() {
  const supabase = useSupabase();

  const { data: departmentStats } = useQuery({
    queryKey: ['department-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_performance')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Analytics</h2>
          <p className="text-gray-500 text-sm">Monitor and export organizational attendance data.</p>
        </div>
        <ExportButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88%</div>
            <div className="h-2 w-full bg-gray-100 rounded-full mt-2">
              <div className="bg-green-500 h-2 rounded-full w-[88%]" />
            </div>
          </CardContent>
        </Card>
        {/* More metric cards... */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Total Records</TableHead>
                <TableHead>Unique Users</TableHead>
                <TableHead>Compliance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentStats?.map((dept: any) => (
                <TableRow key={dept.department_name}>
                  <TableCell className="font-medium">{dept.department_name}</TableCell>
                  <TableCell>{dept.total_records}</TableCell>
                  <TableCell>{dept.unique_users}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      High
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
