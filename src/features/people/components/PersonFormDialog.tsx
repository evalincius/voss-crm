import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  personFormSchema,
  personLifecycleValues,
  type PersonFormInput,
  type PersonFormSchema,
} from "@/features/people/schemas/people.schema";
import { useCreatePerson, useUpdatePerson } from "@/features/people/hooks/usePeople";
import type { Person } from "@/features/people/types";

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  person?: Person;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  person,
}: PersonFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();

  const isEditing = !!person;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormInput, unknown, PersonFormSchema>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      full_name: person?.full_name ?? "",
      email: person?.email ?? "",
      phone: person?.phone ?? "",
      notes: person?.notes ?? "",
      lifecycle: person?.lifecycle ?? "new",
    },
  });

  useEffect(() => {
    reset({
      full_name: person?.full_name ?? "",
      email: person?.email ?? "",
      phone: person?.phone ?? "",
      notes: person?.notes ?? "",
      lifecycle: person?.lifecycle ?? "new",
    });
  }, [person, reset]);

  const lifecycle = watch("lifecycle");

  async function onSubmit(values: PersonFormSchema) {
    setServerError(null);

    try {
      if (isEditing && person) {
        await updatePersonMutation.mutateAsync({
          id: person.id,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          notes: values.notes,
          lifecycle: values.lifecycle,
        });
        toast.success("Person updated");
      } else {
        await createPersonMutation.mutateAsync({
          organization_id: organizationId,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          notes: values.notes,
          lifecycle: values.lifecycle,
          created_by: userId,
        });
        toast.success("Person created");
      }

      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to save person");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit person" : "Add person"}</DialogTitle>
          <DialogDescription>Capture lead profile details and lifecycle stage.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="person-full-name">Full name</Label>
            <Input id="person-full-name" {...register("full_name")} />
            {errors.full_name ? (
              <p className="text-destructive text-sm">{errors.full_name.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="person-email">Email</Label>
              <Input id="person-email" type="email" {...register("email")} />
              {errors.email ? (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="person-phone">Phone</Label>
              <Input id="person-phone" {...register("phone")} />
              {errors.phone ? (
                <p className="text-destructive text-sm">{errors.phone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="person-lifecycle">Lifecycle</Label>
            <Select
              value={lifecycle}
              onValueChange={(value) =>
                setValue("lifecycle", value as PersonFormSchema["lifecycle"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="person-lifecycle">
                <SelectValue placeholder="Lifecycle" />
              </SelectTrigger>
              <SelectContent>
                {personLifecycleValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="person-notes">Notes</Label>
            <textarea
              id="person-notes"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("notes")}
            />
            {errors.notes ? (
              <p className="text-destructive text-sm">{errors.notes.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create person"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
