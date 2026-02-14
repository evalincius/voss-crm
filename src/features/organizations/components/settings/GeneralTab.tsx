import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateOrganization } from "@/features/organizations/hooks/useOrgSettings";
import {
  updateOrgSchema,
  type UpdateOrgSchema,
} from "@/features/organizations/schemas/orgSettings.schema";

export function GeneralTab() {
  const { currentOrganization } = useAuth();
  const updateOrg = useUpdateOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateOrgSchema>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: currentOrganization?.name ?? "",
    },
  });

  async function onSubmit(data: UpdateOrgSchema) {
    if (!currentOrganization) return;

    try {
      await updateOrg.mutateAsync({ orgId: currentOrganization.id, name: data.name });
      toast.success("Organization name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update organization");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">General</CardTitle>
        <CardDescription>Manage your organization's basic information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" {...register("name")} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
