import type { StructureResolver } from "sanity/structure";

const DEEP_FILTER = (slug: string) =>
  `_type == "product" && (` +
  `category->slug.current == "${slug}" || ` +
  `category->parentCategory->slug.current == "${slug}" || ` +
  `category->parentCategory->parentCategory->slug.current == "${slug}" || ` +
  `category->parentCategory->parentCategory->parentCategory->slug.current == "${slug}"` +
  `)`;

export const structure: StructureResolver = (S) =>
  S.list()
    .title("The Saint's TechNet")
    .items([
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

              // ── Computers ────────────────────────────────────
              S.listItem()
                .title("Computers")
                .child(
                  S.list()
                    .title("Computers")
                    .items([
                      S.listItem().title("Gaming Laptops").child(
                        S.documentTypeList("product").title("Gaming Laptops").filter(DEEP_FILTER("gaming-laptops")),
                      ),
                      S.listItem().title("Regular Laptops").child(
                        S.documentTypeList("product").title("Regular Laptops").filter(DEEP_FILTER("regular-laptops")),
                      ),
                      S.listItem().title("MacBooks").child(
                        S.documentTypeList("product").title("MacBooks").filter(DEEP_FILTER("macbook")),
                      ),
                      S.listItem().title("SFF Computers").child(
                        S.documentTypeList("product").title("SFF Computers").filter(DEEP_FILTER("sff-computers")),
                      ),
                      S.listItem().title("eGPU & Enclosures").child(
                        S.documentTypeList("product").title("eGPU & Enclosures").filter(DEEP_FILTER("egpu-enclosures")),
                      ),
                    ]),
                ),

              // ── Accessories ───────────────────────────────────
              S.listItem()
                .title("Accessories")
                .child(
                  S.list()
                    .title("Accessories")
                    .items([
                      S.listItem().title("Headsets").child(
                        S.documentTypeList("product").title("Headsets").filter(DEEP_FILTER("headsets")),
                      ),
                      S.listItem().title("Keyboards").child(
                        S.documentTypeList("product").title("Keyboards").filter(DEEP_FILTER("keyboards")),
                      ),
                      S.listItem().title("Mice").child(
                        S.documentTypeList("product").title("Mice").filter(DEEP_FILTER("mice")),
                      ),
                      S.listItem().title("Webcams").child(
                        S.documentTypeList("product").title("Webcams").filter(DEEP_FILTER("cameras-webcam")),
                      ),
                    ]),
                ),

              // ── Tech Setup Gears ──────────────────────────────
              S.listItem()
                .title("Tech Setup Gears")
                .child(
                  S.list()
                    .title("Tech Setup Gears")
                    .items([
                      S.listItem().title("Gaming Chairs").child(
                        S.documentTypeList("product").title("Gaming Chairs").filter(DEEP_FILTER("gaming-chairs")),
                      ),
                      S.listItem().title("Ergonomic Chairs").child(
                        S.documentTypeList("product").title("Ergonomic Chairs").filter(DEEP_FILTER("ergonomic-chairs")),
                      ),
                      S.listItem().title("Tables & Desks").child(
                        S.documentTypeList("product").title("Tables & Desks").filter(DEEP_FILTER("tables-desks")),
                      ),
                    ]),
                ),

              S.divider(),

              // ── Monitors ─────────────────────────────────────
              S.listItem()
                .title("Monitors")
                .child(
                  S.list()
                    .title("Monitors")
                    .items([
                      S.listItem().title("Professional Monitors").child(
                        S.documentTypeList("product").title("Professional Monitors").filter(DEEP_FILTER("monitors-professional")),
                      ),
                      S.listItem().title("Gaming Monitors").child(
                        S.documentTypeList("product").title("Gaming Monitors").filter(DEEP_FILTER("monitors-gaming")),
                      ),
                    ]),
                ),

              S.divider(),

              // ── Content Creation ──────────────────────────────
              S.listItem()
                .title("Content Creation Tools")
                .child(
                  S.list()
                    .title("Content Creation Tools")
                    .items([
                      S.listItem().title("Cameras").child(
                        S.documentTypeList("product").title("Cameras").filter(DEEP_FILTER("cameras")),
                      ),
                      S.listItem().title("Microphones").child(
                        S.documentTypeList("product").title("Microphones").filter(DEEP_FILTER("microphones")),
                      ),
                      S.listItem().title("Lighting").child(
                        S.documentTypeList("product").title("Lighting").filter(DEEP_FILTER("lighting")),
                      ),
                      S.listItem().title("Stabilization & Mounts").child(
                        S.documentTypeList("product").title("Stabilization & Mounts").filter(DEEP_FILTER("stabilization-mounts")),
                      ),
                      S.listItem().title("Aerials & Drones").child(
                        S.documentTypeList("product").title("Aerials & Drones").filter(DEEP_FILTER("aerials-drones")),
                      ),
                      S.listItem().title("Smart Wearables").child(
                        S.documentTypeList("product").title("Smart Wearables").filter(DEEP_FILTER("smart-wearables")),
                      ),
                    ]),
                ),

              S.divider(),

              S.listItem().title("Custom PCs").child(
                S.documentTypeList("product").title("Custom PCs").filter(DEEP_FILTER("custom-pcs")),
              ),
              S.listItem().title("EcoFlow").child(
                S.documentTypeList("product").title("EcoFlow").filter(DEEP_FILTER("ecoflow")),
              ),
              S.listItem().title("Starlink").child(
                S.documentTypeList("product").title("Starlink").filter(DEEP_FILTER("starlink")),
              ),

              S.divider(),

              S.listItem().title("Featured Products").child(
                S.documentTypeList("product").title("Featured Products").filter('_type == "product" && featured == true'),
              ),
              S.listItem().title("Out of Stock").child(
                S.documentTypeList("product").title("Out of Stock").filter('_type == "product" && stock == 0'),
              ),
            ]),
        ),

      S.divider(),

      S.listItem().title("Categories").child(
        S.list().title("Categories").items([
          S.listItem().title("Top-level Categories").child(
            S.documentTypeList("category").title("Top-level Categories").filter('_type == "category" && !defined(parentCategory)'),
          ),
          S.listItem().title("All Subcategories").child(
            S.documentTypeList("category").title("All Subcategories").filter('_type == "category" && defined(parentCategory)'),
          ),
        ]),
      ),

      S.divider(),

      S.listItem().title("Brands").child(S.documentTypeList("brand").title("Brands")),
      S.listItem().title("Conditions").child(S.documentTypeList("condition").title("Conditions")),
      S.listItem().title("Models").child(S.documentTypeList("model").title("Models")),

      S.divider(),

      S.listItem().title("Orders").child(S.documentTypeList("order").title("Orders")),
      S.listItem().title("Customers").child(S.documentTypeList("customer").title("Customers")),
    ]);