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
  productFormSchema,
  type ProductFormInput,
  type ProductFormSchema,
} from "@/features/library/products/schemas/products.schema";
import { useCreateProduct, useUpdateProduct } from "@/features/library/products/hooks/useProducts";
import type { Product } from "@/features/library/products/types";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  product?: Product;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  product,
}: ProductFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: product?.name ?? "",
      description: product?.description ?? "",
    });
  }, [product, reset]);

  async function onSubmit(values: ProductFormSchema) {
    setServerError(null);

    try {
      if (isEditing && product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          name: values.name,
          description: values.description,
        });
        toast.success("Product updated");
      } else {
        await createProductMutation.mutateAsync({
          organization_id: organizationId,
          name: values.name,
          description: values.description,
          created_by: userId,
        });
        toast.success("Product created");
      }

      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to save product");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Keep product catalog entries clean and reusable across deals and templates.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="product-name">Name</Label>
            <Input id="product-name" {...register("name")} />
            {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Description</Label>
            <textarea
              id="product-description"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
