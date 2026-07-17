# Shipping availability

This module links products to Medusa shipping-option IDs and pickup shipping
options to enabled pickup-location IDs. Shipping-option names are display data
only and are never used for eligibility decisions.

Deployment order:

1. Run `npx medusa db:migrate`.
2. Configure the delivery and pickup shipping options in Admin. Each option
   with `metadata.type=pickup` must be assigned one enabled pickup location.
3. Dry-run the existing-product backfill with real environment IDs:
   `npx medusa exec ./src/scripts/backfill-product-shipping-options.ts --option-ids=so_mail,so_hk,so_mo --dry-run`
4. Run the same command without `--dry-run`, then run the dry-run again. The
   second dry-run must report `changed=0`.

Product CSV import/export uses a required `shipping_option_ids` column. IDs are
semicolon-separated. New imports therefore do not depend on the one-time
backfill.
