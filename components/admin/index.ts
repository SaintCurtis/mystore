// components/admin/index.tsx

// Core UI Components
export { StatCard } from "./StatCard";
export { LowStockAlert } from "./LowStockAlert";
export { RecentOrders } from "./RecentOrders";
export { AIInsightsCard } from "./AIInsightsCard";

// Form Inputs (updated to new pattern: documentId + initialValue)
export { StockInput } from "./StockInput";
export { PriceInput } from "./PriceInput";
export { FeaturedToggle } from "./FeaturedToggle";
export { AddressEditor } from "./AddressEditor";
export { StatusSelect } from "./StatusSelect";

// Row Components
export { ProductRow, ProductRowSkeleton } from "./ProductRow";
export { OrderRow, OrderRowSkeleton } from "./OrderRow";

// Utility Components
export { ImageUploader } from "./ImageUploader";
export { DeleteButton } from "./DeleteButton";

// Search & Helpers
export {
  AdminSearch,
  useProductSearchFilter,
  useOrderSearchFilter,
  useDebouncedValue,
} from "./AdminSearch";

// Table Headers
export { OrderTableHeader, ProductTableHeader } from "./table-headers";