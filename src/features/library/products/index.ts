export { ProductsListView } from "./components/ProductsListView";
export { ProductFormDialog } from "./components/ProductFormDialog";
export { ProductDetailView } from "./components/ProductDetailView";
export {
  useProductsList,
  useProductOptions,
  useProductDetail,
  useProductPerformanceSummary,
  useCreateProduct,
  useUpdateProduct,
  useArchiveProduct,
  useUnarchiveProduct,
} from "./hooks/useProducts";
export { productFormSchema, productFiltersSchema } from "./schemas/products.schema";
export {
  listProducts,
  listProductOptions,
  getProductById,
  createProduct,
  updateProduct,
  archiveProduct,
  unarchiveProduct,
  listLinkedTemplatesForProduct,
  getProductPerformanceSummary,
} from "./services/productsService";
export type {
  Product,
  ProductArchiveFilter,
  ProductSort,
  ProductListParams,
  ProductPerformanceSummary,
  DealStage,
} from "./types";
