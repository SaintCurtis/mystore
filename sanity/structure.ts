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
                    .filter(
                      '_type == "product" && (category->slug.current == "gaming-laptops" || category->parentCategory->slug.current == "gaming-laptops")',
                    ),
                ),
              S.listItem()
                .title("Regular Laptops")
                .child(
                  S.documentTypeList("product")
                    .title("Regular Laptops")
                    .filter(
                      '_type == "product" && (category->slug.current == "regular-laptops" || category->parentCategory->slug.current == "regular-laptops")',
                    ),
                ),
              S.listItem()
                .title("MacBooks")
                .child(
                  S.documentTypeList("product")
                    .title("MacBooks")
                    .filter(
                      '_type == "product" && (category->slug.current == "macbook" || category->parentCategory->slug.current == "macbook")',
                    ),
                ),
              S.listItem()
                .title("Custom PCs")
                .child(
                  S.documentTypeList("product")
                    .title("Custom PCs")
                    .filter(
                      '_type == "product" && category->slug.current == "custom-pcs"',
                    ),
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
                    .filter(
                      '_type == "category" && !defined(parentCategory)',
                    ),
                ),
              S.listItem()
                .title("Subcategories (Condition)")
                .child(
                  S.documentTypeList("category")
                    .title("Condition Subcategories")
                    .filter(
                      '_type == "category" && defined(parentCategory)',
                    ),
                ),
            ]),
        ),

      S.divider(),

      // ── Classification ────────────────────────────────────────
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

      // ── Orders & Customers ────────────────────────────────────
      S.listItem()
        .title("Orders")
        .child(S.documentTypeList("order").title("Orders")),

      S.listItem()
        .title("Customers")
        .child(S.documentTypeList("customer").title("Customers")),
    ]);