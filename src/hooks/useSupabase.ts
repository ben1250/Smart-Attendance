import { useSession } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export function useSupabase() {
  const { session } = useSession();
  const [client, setClient] = useState<SupabaseClient>(getSupabaseClient());

  useEffect(() => {
    const updateClient = async () => {
      if (session) {
        const token = await session.getToken({ template: "supabase" });
        setClient(getSupabaseClient(token || undefined));
      } else {
        setClient(getSupabaseClient());
      }
    };

    updateClient();
  }, [session]);

  return client;
}
