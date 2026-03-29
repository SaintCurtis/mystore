import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const modelType = defineType({
  name: "model",
  title: "Model",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      title: "Model Name",
      type: "string",
      validation: (rule) => rule.required().error("Model name is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
    defineField({
      name: "brand",
      title: "Brand",
      type: "reference",
      to: [{ type: "brand" }],
      description: "Which brand does this model belong to?",
    }),
  ],
  preview: {
    select: {
      title: "title",
      brand: "brand.title",
    },
    prepare({ title, brand }) {
      return {
        title,
        subtitle: brand ? brand : "⚠️ No brand set",
      };
    },
  },
});