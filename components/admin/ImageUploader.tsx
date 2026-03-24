"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { writeClient } from "@/sanity/lib/client";
import {
  Upload,
  X,
  Loader2,
  ImageIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SanityImageAsset {
  _type: "image";
  _key: string;
  asset: {
    _type: "reference";
    _ref: string;
  };
}

interface ImageWithUrl {
  _key: string;
  _type: string;
  asset: {
    _ref: string;
    url?: string;
  } | null;
}

interface ImageUploaderProps {
  documentId: string;
  initialImages?: ImageWithUrl[];
}

export function ImageUploader({ documentId, initialImages }: ImageUploaderProps) {
  const [images, setImages] = useState<ImageWithUrl[]>(initialImages ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current images if not passed as props
  useEffect(() => {
    if (initialImages) return;
    async function fetchImages() {
      try {
        const doc = await writeClient.fetch<{ images?: ImageWithUrl[] }>(
          `*[_id == $id][0]{ images }`,
          { id: documentId }
        );
        setImages(doc?.images ?? []);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, [documentId, initialImages]);

  const saveImages = async (updatedImages: ImageWithUrl[]) => {
    await writeClient
      .patch(documentId)
      .set({ images: updatedImages.length > 0 ? updatedImages : [] })
      .commit();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${files.length} image(s)...`);

    try {
      const newImages: SanityImageAsset[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        const asset = await writeClient.assets.upload("image", file, {
          filename: file.name,
        });

        newImages.push({
          _type: "image",
          _key: crypto.randomUUID(),
          asset: {
            _type: "reference",
            _ref: asset._id,
          },
        });
      }

      const updatedImages = [...images, ...newImages] as ImageWithUrl[];
      setImages(updatedImages);
      await saveImages(updatedImages);
      setUploadProgress(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress("Upload failed. Please try again.");
      setTimeout(() => setUploadProgress(null), 3000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (keyToRemove: string) => {
    const updatedImages = images.filter((img) => img._key !== keyToRemove);
    setImages(updatedImages);
    await saveImages(updatedImages);
  };

  const handleMoveImage = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setImages(updatedImages);
    await saveImages(updatedImages);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="aspect-square rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadProgress}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </>
          )}
        </Button>
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <ImageThumbnail
              key={image._key}
              image={image}
              index={index}
              isFirst={index === 0}
              onRemove={() => handleRemoveImage(image._key)}
              onMoveUp={() => handleMoveImage(index, index - 1)}
              onMoveDown={() => handleMoveImage(index, index + 1)}
              canMoveUp={index > 0}
              canMoveDown={index < images.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 py-8 dark:border-zinc-700">
          <ImageIcon className="mb-2 h-10 w-10 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No images uploaded
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Click upload to add product images
          </p>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          First image is the main product image. Use arrows to reorder.
        </p>
      )}
    </div>
  );
}

// ── Image Thumbnail ────────────────────────────────────────────────────────

interface ImageThumbnailProps {
  image: ImageWithUrl;
  index: number;
  isFirst: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function ImageThumbnail({
  image,
  isFirst,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ImageThumbnailProps) {
  const assetRef = image.asset?._ref;
  let imageUrl: string | null = null;

  if (assetRef) {
    const match = assetRef.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/);
    if (match) {
      const [, id, dimensions, format] = match;
      imageUrl = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${id}-${dimensions}.${format}`;
    }
  }

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800",
        isFirst &&
          "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900",
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Product image"
          fill
          className="object-cover"
          sizes="150px"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className="h-8 w-8 text-zinc-400" />
        </div>
      )}

      {isFirst && (
        <div className="absolute left-2 top-2 rounded bg-blue-500 px-1.5 py-0.5 text-xs font-medium text-white">
          Main
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-7 w-7"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}