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
  ],
  preview: {
    select: {
      title: "title",
    },
  },
});