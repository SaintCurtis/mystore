import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const conditionType = defineType({
  name: "condition",
  title: "Condition",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required().error("Condition title is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? `slug: ${subtitle}` : "⚠️ No slug set",
      };
    },
  },
});