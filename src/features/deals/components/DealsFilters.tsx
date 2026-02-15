import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductOptions } from "@/features/library/products/hooks/useProducts";

interface DealsFiltersProps {
  organizationId: string;
  productId: string | null;
  personSearch: string;
  onProductChange: (productId: string | null) => void;
  onPersonSearchChange: (search: string) => void;
}

export function DealsFilters({
  organizationId,
  productId,
  personSearch,
  onProductChange,
  onPersonSearchChange,
}: DealsFiltersProps) {
  const productOptionsQuery = useProductOptions(organizationId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(personSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      onPersonSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onPersonSearchChange]);

  function handleProductChange(value: string) {
    const newProductId = value === "__all__" ? null : value;
    onProductChange(newProductId);

    const next = new URLSearchParams(searchParams);
    if (newProductId) {
      next.set("product_id", newProductId);
    } else {
      next.delete("product_id");
    }
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={productId ?? "__all__"} onValueChange={handleProductChange}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All products</SelectItem>
          {(productOptionsQuery.data ?? []).map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Search by person..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="w-52"
      />
    </div>
  );
}
