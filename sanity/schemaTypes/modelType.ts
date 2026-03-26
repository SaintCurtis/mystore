import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const modelType = defineType({
  name: "model",
  title: "Model",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "name",
      title: "Model Name",
      type: "string",
      validation: (rule) => rule.required().error("Model name is required"),
    }),
    defineField({
      name: "brand",
      title: "Brand",
      type: "reference",
      to: [{ type: "brand" }],
    }),
  ],
  preview: {
    select: {
      title: "name",
      brandName: "brand.name",
    },
    prepare(selection) {
      const { title, brandName } = selection;
      return {
        title: title,
        subtitle: brandName ? `by ${brandName}` : "",
      };
    },
  },
});