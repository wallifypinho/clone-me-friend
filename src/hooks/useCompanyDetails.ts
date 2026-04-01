import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyDetails {
  name: string;
  razao_social: string | null;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  logo: string | null;
}

const cache = new Map<string, CompanyDetails>();

export function useCompanyDetails(companyName: string): CompanyDetails | null {
  const [details, setDetails] = useState<CompanyDetails | null>(
    cache.get(companyName) || null
  );

  useEffect(() => {
    if (!companyName) return;
    if (cache.has(companyName)) {
      setDetails(cache.get(companyName)!);
      return;
    }

    supabase
      .from("companies")
      .select("name, razao_social, cnpj, cidade, estado, logo")
      .eq("name", companyName)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data as CompanyDetails;
          cache.set(companyName, d);
          setDetails(d);
        }
      });
  }, [companyName]);

  return details;
}
