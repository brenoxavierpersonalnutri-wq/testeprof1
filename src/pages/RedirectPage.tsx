import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const redirect = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("rotator-redirect", {
          body: { slug },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.redirect_url) {
          window.location.href = data.redirect_url;
        } else if (data?.error) {
          setError(data.error);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao redirecionar");
      }
    };

    redirect();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm">Redirecionando...</span>
        </div>
      )}
    </div>
  );
}
