"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { writeClient } from "@/sanity/lib/client";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader, DeleteButton } from "@/components/admin";

const MATERIALS = [
  { value: "wood", label: "Wood" },
  { value: "metal", label: "Metal" },
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "glass", label: "Glass" },
];

const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "oak", label: "Oak" },
  { value: "walnut", label: "Walnut" },
  { value: "grey", label: "Grey" },
  { value: "natural", label: "Natural" },
];

interface Product {
  _id: string;
  name?: string;
  slug?: { current?: string };
  description?: string;
  price?: number;
  stock?: number;
  material?: string;
  color?: string;
  dimensions?: string;
  featured?: boolean;
  assemblyRequired?: boolean;
  images?: any[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Local form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [featured, setFeatured] = useState(false);
  const [assemblyRequired, setAssemblyRequired] = useState(false);

  // Fetch product
  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await writeClient.fetch<Product>(
          `*[_id == $id][0]{
            _id, name, slug, description, price, stock,
            material, color, dimensions, featured, assemblyRequired,
            images[]{ _key, _type, asset->{ _ref, url } }
          }`,
          { id }
        );

        if (data) {
          setProduct(data);
          setName(data.name ?? "");
          setSlug(data.slug?.current ?? "");
          setDescription(data.description ?? "");
          setPrice(data.price ?? 0);
          setStock(data.stock ?? 0);
          setMaterial(data.material ?? "");
          setColor(data.color ?? "");
          setDimensions(data.dimensions ?? "");
          setFeatured(data.featured ?? false);
          setAssemblyRequired(data.assemblyRequired ?? false);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // Save field on blur
  const saveField = async (field: string, value: any) => {
    if (value === undefined || value === null) return;

    setSaving(field);
    try {
      await writeClient.patch(id).set({ [field]: value }).commit();
    } catch (error) {
      console.error(`Failed to save ${field}:`, error);
    } finally {
      setSaving(null);
    }
  };

  const savingIndicator = (field: string) =>
    saving === field ? (
      <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-zinc-400" />
    ) : null;

  if (loading) {
    return <div className="space-y-8"> {/* Your existing skeleton */} </div>;
  }

  if (!product) {
    return <div className="py-16 text-center text-zinc-500">Product not found.</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/inventory"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inventory
      </Link>

      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              {name || "Untitled Product"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Edit product details</p>
          </div>

          <DeleteButton documentId={id} documentType="product" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="mb-4 font-semibold">Basic Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name {savingIndicator("name")}</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => saveField("name", name)}
                    placeholder="Product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug {savingIndicator("slug")}</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    onBlur={() => saveField("slug", { _type: "slug", current: slug })}
                    placeholder="product-slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description {savingIndicator("description")}</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => saveField("description", description)}
                    rows={5}
                    placeholder="Detailed product description..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="mb-4 font-semibold">Pricing & Inventory</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Price (₦) {savingIndicator("price")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    onBlur={() => saveField("price", price)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock {savingIndicator("stock")}</Label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    onBlur={() => saveField("stock", stock)}
                  />
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="mb-4 font-semibold">Attributes</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Material {savingIndicator("material")}</Label>
                  <Select value={material} onValueChange={(v) => { setMaterial(v); saveField("material", v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color {savingIndicator("color")}</Label>
                  <Select value={color} onValueChange={(v) => { setColor(v); saveField("color", v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Dimensions {savingIndicator("dimensions")}</Label>
                  <Input
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    onBlur={() => saveField("dimensions", dimensions)}
                    placeholder='e.g., "120cm x 80cm x 75cm"'
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="mb-4 font-semibold">Options</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Featured Product</p>
                    <p className="text-sm text-zinc-500">Show on homepage</p>
                  </div>
                  <Switch
                    checked={featured}
                    onCheckedChange={(checked) => {
                      setFeatured(checked);
                      saveField("featured", checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Assembly Required</p>
                    <p className="text-sm text-zinc-500">Customer must assemble</p>
                  </div>
                  <Switch
                    checked={assemblyRequired}
                    onCheckedChange={(checked) => {
                      setAssemblyRequired(checked);
                      saveField("assemblyRequired", checked);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Images & Links */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="mb-4 font-semibold">Product Images</h2>
              <ImageUploader
                documentId={id}
                initialImages={product.images}
              />

              {slug && (
                <Link
                  href={`/products/${slug}`}
                  target="_blank"
                  className="mt-4 flex items-center justify-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  View on store <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="font-semibold">Advanced Editing</h2>
              <p className="mt-2 text-sm text-zinc-500">Set category, variants, etc. in Studio</p>
              <Link
                href={`/studio/structure/product;${id}`}
                target="_blank"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                Open in Studio <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}