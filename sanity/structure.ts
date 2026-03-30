import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("The Saint's TechNet")
    .items([
      // ── Products ──────────────────────────────────────────────
      S.listItem()
        .title("Products")
        .child(
          S.list()
            .title("Products")
            .items([
              S.listItem()
                .title("All Products")
                .child(S.documentTypeList("product").title("All Products")),
              S.divider(),
              S.listItem()
                .title("Gaming Laptops")
                .child(
                  S.documentTypeList("product")
                    .title("Gaming Laptops")
                    .filter('_type == "product" && (category->slug.current == "gaming-laptops" || category->parentCategory->slug.current == "gaming-laptops" || category->parentCategory->parentCategory->slug.current == "gaming-laptops" || category->parentCategory->parentCategory->parentCategory->slug.current == "gaming-laptops")'),
                ),
              S.listItem()
                .title("Regular Laptops")
                .child(
                  S.documentTypeList("product")
                    .title("Regular Laptops")
                    .filter('_type == "product" && (category->slug.current == "regular-laptops" || category->parentCategory->slug.current == "regular-laptops" || category->parentCategory->parentCategory->slug.current == "regular-laptops" || category->parentCategory->parentCategory->parentCategory->slug.current == "regular-laptops")'),
                ),
              S.listItem()
                .title("MacBooks")
                .child(
                  S.documentTypeList("product")
                    .title("MacBooks")
                    .filter('_type == "product" && (category->slug.current == "macbook" || category->parentCategory->slug.current == "macbook" || category->parentCategory->parentCategory->slug.current == "macbook" || category->parentCategory->parentCategory->parentCategory->slug.current == "macbook")'),
                ),
              S.listItem()
                .title("Monitors")
                .child(
                  S.documentTypeList("product")
                    .title("Monitors")
                    .filter('_type == "product" && (category->slug.current == "monitors" || category->parentCategory->slug.current == "monitors" || category->parentCategory->parentCategory->slug.current == "monitors" || category->parentCategory->parentCategory->parentCategory->slug.current == "monitors")'),
                ),
              S.divider(),
              S.listItem()
                .title("Content Creation Tools")
                .child(
                  S.list()
                    .title("Content Creation Tools")
                    .items([
                      S.listItem()
                        .title("Cameras")
                        .child(
                          S.documentTypeList("product")
                            .title("Cameras")
                            .filter('_type == "product" && (category->slug.current == "cameras" || category->parentCategory->slug.current == "cameras" || category->parentCategory->parentCategory->slug.current == "cameras" || category->parentCategory->parentCategory->parentCategory->slug.current == "cameras")'),
                        ),
                      S.listItem()
                        .title("Microphones")
                        .child(
                          S.documentTypeList("product")
                            .title("Microphones")
                            .filter('_type == "product" && (category->slug.current == "microphones" || category->parentCategory->slug.current == "microphones" || category->parentCategory->parentCategory->slug.current == "microphones" || category->parentCategory->parentCategory->parentCategory->slug.current == "microphones")'),
                        ),
                      S.listItem()
                        .title("Lighting")
                        .child(
                          S.documentTypeList("product")
                            .title("Lighting")
                            .filter('_type == "product" && (category->slug.current == "lighting" || category->parentCategory->slug.current == "lighting" || category->parentCategory->parentCategory->slug.current == "lighting" || category->parentCategory->parentCategory->parentCategory->slug.current == "lighting")'),
                        ),
                      S.listItem()
                        .title("Stabilization & Mounts")
                        .child(
                          S.documentTypeList("product")
                            .title("Stabilization & Mounts")
                            .filter('_type == "product" && (category->slug.current == "stabilization-mounts" || category->parentCategory->slug.current == "stabilization-mounts" || category->parentCategory->parentCategory->slug.current == "stabilization-mounts" || category->parentCategory->parentCategory->parentCategory->slug.current == "stabilization-mounts")'),
                        ),
                      S.listItem()
                        .title("Aerials & Drones")
                        .child(
                          S.documentTypeList("product")
                            .title("Aerials & Drones")
                            .filter('_type == "product" && (category->slug.current == "aerials-drones" || category->parentCategory->slug.current == "aerials-drones" || category->parentCategory->parentCategory->slug.current == "aerials-drones" || category->parentCategory->parentCategory->parentCategory->slug.current == "aerials-drones")'),
                        ),
                      S.listItem()
                        .title("Smart Wearables")
                        .child(
                          S.documentTypeList("product")
                            .title("Smart Wearables")
                            .filter('_type == "product" && (category->slug.current == "smart-wearables" || category->parentCategory->slug.current == "smart-wearables" || category->parentCategory->parentCategory->slug.current == "smart-wearables" || category->parentCategory->parentCategory->parentCategory->slug.current == "smart-wearables")'),
                        ),
                    ]),
                ),
              S.divider(),
              S.listItem()
                .title("Custom PCs")
                .child(
                  S.documentTypeList("product")
                    .title("Custom PCs")
                    .filter('_type == "product" && category->slug.current == "custom-pcs"'),
                ),
              S.divider(),
              S.listItem()
                .title("Featured Products")
                .child(
                  S.documentTypeList("product")
                    .title("Featured Products")
                    .filter('_type == "product" && featured == true'),
                ),
              S.listItem()
                .title("Out of Stock")
                .child(
                  S.documentTypeList("product")
                    .title("Out of Stock")
                    .filter('_type == "product" && stock == 0'),
                ),
            ]),
        ),

      S.divider(),

      // ── Categories ────────────────────────────────────────────
      S.listItem()
        .title("Categories")
        .child(
          S.list()
            .title("Categories")
            .items([
              S.listItem()
                .title("Top-level Categories")
                .child(
                  S.documentTypeList("category")
                    .title("Top-level Categories")
                    .filter('_type == "category" && !defined(parentCategory)'),
                ),
              S.listItem()
                .title("All Subcategories")
                .child(
                  S.documentTypeList("category")
                    .title("All Subcategories")
                    .filter('_type == "category" && defined(parentCategory)'),
                ),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title("Brands")
        .child(S.documentTypeList("brand").title("Brands")),
      S.listItem()
        .title("Conditions")
        .child(S.documentTypeList("condition").title("Conditions")),
      S.listItem()
        .title("Models")
        .child(S.documentTypeList("model").title("Models")),

      S.divider(),

      S.listItem()
        .title("Orders")
        .child(S.documentTypeList("order").title("Orders")),
      S.listItem()
        .title("Customers")
        .child(S.documentTypeList("customer").title("Customers")),
    ]);