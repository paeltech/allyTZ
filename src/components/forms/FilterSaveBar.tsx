"use client";

import React from "react";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";

type Props = {
  page: "events";
  values: Record<string, any>;
};

const FilterSaveBar: React.FC<Props> = ({ page, values }) => {
  const { session } = useSupabaseSession();

  const handleSave = async () => {
    if (!session?.user?.id) {
      showError("You must be signed in to save filters");
      throw new Error("Not authenticated");
    }
    const { error } = await supabase
      .from("user_filters")
      .insert({ user_id: session.user.id, page, data: values });
    if (error) {
      showError(error.message);
      throw error;
    }
    showSuccess("Filters saved");
  };

  return (
    <div className="flex items-center justify-end">
      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
        Save Filters
      </Button>
    </div>
  );
};

export default FilterSaveBar;