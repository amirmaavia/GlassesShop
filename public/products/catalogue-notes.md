# Eyewear product assets

Source: the two WhatsApp ZIP archives supplied on 31 October 2026. Repeated views were grouped into one style. The existing Kids Panda White & Turquoise listing was retained.

The new `studio.png` assets were edited with the built-in imagegen tool. The original archive files are retained separately under `data/import-review`, rather than exposed in product galleries.

Prompt template: Isolate only the exact eyeglasses or sunglasses shown. Preserve frame geometry, colour, temples, lens tint, viewing angle and product markings. Remove promotional headlines, discount badges, icons, boxes, cloths, plants, tabletop reflections and background. Centre the complete pair with padding on a transparent square canvas. Do not invent accessories or alter the product design.

The product manifest is `src/data/imported-eyewear.json`; the import command is `node scripts/import-eyewear.mjs`. Names describe visible styles rather than claiming brand authenticity. Materials and measurements remain unconfirmed. Newly imported styles have zero available stock pending confirmation. Provisional frame prices: kids Rs. 1,200; eyeglasses Rs. 2,500; sunglasses Rs. 3,500. Existing product prices and stock are preserved.

The importer saves a catalogue backup in `data/import-backups` before modifying the connected store. Historical orders and lens pricing configuration are preserved.
