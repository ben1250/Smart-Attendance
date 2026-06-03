import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/hooks/useSupabase";
import { ClipboardCopy, Send, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  department_id: z.string().uuid("Please select a department"),
});

export default function FormBuilder() {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { data: form, error } = await supabase
        .from('attendance_forms')
        .insert({
          title: data.title,
          description: data.description,
          department_id: data.department_id,
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/attendance/form/${form.id}`;
      setGeneratedLink(link);
      toast({
        title: "Success!",
        description: "Attendance form created successfully.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({ description: "Link copied to clipboard!" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card className="border-l-4 border-l-violet-600">
        <CardHeader>
          <CardTitle className="text-2xl text-violet-900">Create Attendance Form</CardTitle>
          <CardDescription>Generate a new shareable form for your department</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Form Title</label>
              <Input {...register("title")} placeholder="e.g., Weekly Staff Meeting" />
              {errors.title && <p className="text-red-500 text-xs">{errors.title.message as string}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input {...register("description")} placeholder="Purpose of this attendance" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Department ID</label>
              <Input {...register("department_id")} placeholder="UUID of the department" />
              {errors.department_id && <p className="text-red-500 text-xs">{errors.department_id.message as string}</p>}
            </div>

            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 w-full">
              {loading ? "Creating..." : <><Plus className="w-4 h-4 mr-2" /> Create Form</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedLink && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-900">Form Ready!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={generatedLink} readOnly className="bg-white" />
              <Button variant="outline" onClick={copyToClipboard}>
                <ClipboardCopy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" /> Share via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
