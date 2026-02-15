import { useEffect, useMemo, useState } from "react";
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
  templateCategoryValues,
  templateFormSchema,
  templateStatusValues,
  type TemplateFormInput,
  type TemplateFormSchema,
} from "@/features/library/templates/schemas/templates.schema";
import {
  useCreateTemplate,
  useSyncTemplateProducts,
  useTemplateLinkedProductIds,
  useTemplateProductOptions,
  useUpdateTemplate,
} from "@/features/library/templates/hooks/useTemplates";
import type { Template } from "@/features/library/templates/types";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  template?: Template;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  template,
}: TemplateFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const syncTemplateProductsMutation = useSyncTemplateProducts();
  const productOptionsQuery = useTemplateProductOptions(organizationId);
  const linkedProductIdsQuery = useTemplateLinkedProductIds(
    template ? organizationId : null,
    template?.id ?? null,
  );

  const isEditing = !!template;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormInput, unknown, TemplateFormSchema>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: template?.title ?? "",
      category: template?.category ?? "cold_email",
      status: template?.status ?? "draft",
      body: template?.body ?? "",
      productIds: [],
    },
  });

  const selectedProductIds = watch("productIds");
  const category = watch("category");
  const status = watch("status");

  const initialProductIds = useMemo(() => {
    if (!template) {
      return [];
    }

    return linkedProductIdsQuery.data ?? [];
  }, [template, linkedProductIdsQuery.data]);

  useEffect(() => {
    if (template) {
      reset({
        title: template.title,
        category: template.category,
        status: template.status,
        body: template.body,
        productIds: initialProductIds,
      });
      return;
    }

    reset({
      title: "",
      category: "cold_email",
      status: "draft",
      body: "",
      productIds: [],
    });
  }, [template, initialProductIds, reset]);

  function toggleProduct(productId: string, checked: boolean) {
    const current = new Set(selectedProductIds ?? []);

    if (checked) {
      current.add(productId);
    } else {
      current.delete(productId);
    }

    setValue("productIds", Array.from(current), { shouldValidate: true });
  }

  async function onSubmit(values: TemplateFormSchema) {
    setServerError(null);

    try {
      if (isEditing && template) {
        const updatedTemplate = await updateTemplateMutation.mutateAsync({
          id: template.id,
          title: values.title,
          category: values.category,
          status: values.status,
          body: values.body,
        });

        await syncTemplateProductsMutation.mutateAsync({
          organizationId,
          templateId: updatedTemplate.id,
          productIds: values.productIds,
          userId,
        });

        toast.success("Template updated");
      } else {
        const createdTemplate = await createTemplateMutation.mutateAsync({
          organization_id: organizationId,
          title: values.title,
          category: values.category,
          status: values.status,
          body: values.body,
          created_by: userId,
        });

        await syncTemplateProductsMutation.mutateAsync({
          organizationId,
          templateId: createdTemplate.id,
          productIds: values.productIds,
          userId,
        });

        toast.success("Template created");
      }

      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to save template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit template" : "Add template"}</DialogTitle>
          <DialogDescription>
            Save reusable messaging and link it to related products.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="template-title">Title</Label>
            <Input id="template-title" {...register("title")} />
            {errors.title ? (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setValue("category", value as TemplateFormSchema["category"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="template-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {templateCategoryValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as TemplateFormSchema["status"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="template-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {templateStatusValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-body">Body</Label>
            <textarea
              id="template-body"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-32 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("body")}
            />
            {errors.body ? <p className="text-destructive text-sm">{errors.body.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Linked products</Label>
            {productOptionsQuery.isLoading ? (
              <p className="text-text-secondary text-sm">Loading products...</p>
            ) : null}
            {productOptionsQuery.isError ? (
              <p className="text-destructive text-sm">Failed to load products</p>
            ) : null}
            {!productOptionsQuery.isLoading && (productOptionsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-text-secondary text-sm">No active products available.</p>
            ) : null}
            <div className="max-h-36 space-y-2 overflow-auto pr-1">
              {(productOptionsQuery.data ?? []).map((product) => {
                const checked = (selectedProductIds ?? []).includes(product.id);

                return (
                  <label key={product.id} className="flex items-center gap-2 text-base">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleProduct(product.id, event.target.checked)}
                    />
                    <span>{product.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create template"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
