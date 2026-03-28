import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required().error("Category title is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      description: "Category thumbnail image",
    }),
    defineField({
      name: "parentCategory",
      title: "Parent Category",
      type: "reference",
      to: [{ type: "category" }],
      description:
        "Leave empty for top-level categories. Set for subcategories (e.g. Brand New under Gaming Laptops).",
    }),
    defineField({
      name: "condition",
      title: "Condition",
      type: "string",
      options: {
        list: [
          { title: "Brand New", value: "brand-new" },
          { title: "Foreign Used (UK/US)", value: "foreign-used" },
        ],
        layout: "radio",
      },
      description:
        "Only set for condition-level subcategories (Brand New / Foreign Used).",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      initialValue: 0,
      description: "Lower numbers appear first.",
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      parent: "parentCategory.title",
      condition: "condition",
      media: "image",
    },
    prepare({ title, parent, condition, media }) {
      const parts = [parent, condition].filter(Boolean).join(" › ");
      return {
        title,
        subtitle: parts || "Top-level category",
        media,
      };
    },
  },
});