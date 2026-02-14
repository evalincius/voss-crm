import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createOrgSchema,
  type CreateOrgSchema,
} from "@/features/organizations/schemas/organization.schema";
import { useCreateOrganization } from "@/features/organizations/hooks/useOrganizations";

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createOrg = useCreateOrganization();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgSchema>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", slug: "" },
  });

  async function onSubmit(data: CreateOrgSchema) {
    setServerError(null);

    try {
      const mutationData: { name: string; slug?: string } = { name: data.name };
      if (data.slug) mutationData.slug = data.slug;
      await createOrg.mutateAsync(mutationData);
      reset();
      onOpenChange(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to create organization");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Add a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border px-4 py-3 text-sm">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" placeholder="Acme Corp" {...register("name")} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">
              Slug <span className="text-text-muted">(optional)</span>
            </Label>
            <Input id="org-slug" placeholder="acme-corp" {...register("slug")} />
            {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create organization"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
