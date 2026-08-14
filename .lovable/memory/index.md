# Project Memory

## Core
Brand: Dreame Beauty Cosmetics Adresa: Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë. Bilingual SQ/EN (SQ default).
Nisha: VETËM produkte për thonj (gel lak, akrilik, gel ndërtues, bazë/top coat, freza & aparate, lampa UV/LED, limë & instrumente, tipsa & forma, nail art, pedikyr, higjenë) — shumicë dhe pakicë. Pa flokë/barber/makeup.
Payment (webshop): Cash on Delivery only.
No paid SMS provider — order status notifications go out via one-click WhatsApp/Viber links from admin.
No email sender domain yet — reports stay CSV/PDF downloads in admin, no automated email sending.
Info pages (FAQ, shipping, returns, privacy, terms) are DB-editable via admin "Faqet informative" (site_settings key `info_pages`).
POS/ARKA lives inside the admin panel (sections ARKA/SHITJE, Historia e shitjeve, Raporti i shitjeve) on the existing `products` table + `pos_sales`/`pos_sale_items`; sales go through the `create_pos_sale` RPC which decrements stock. Customer second screen: /pos-display via BroadcastChannel. Receipts print 58/80mm thermal.
