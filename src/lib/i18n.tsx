import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "sq" | "en";

type Dict = Record<string, { sq: string; en: string }>;

export const t: Dict = {
  brand: { sq: "Bella Salon Supplies", en: "Bella Salon Supplies" },
  tagline: { sq: "Furnizim profesional për sallone bukurie", en: "Professional beauty salon supplies" },
  home: { sq: "Ballina", en: "Home" },
  shop: { sq: "Dyqani", en: "Shop" },
  cart: { sq: "Shporta", en: "Cart" },
  categories: { sq: "Kategoritë", en: "Categories" },
  featured: { sq: "Të Zgjedhurat", en: "Featured" },
  viewAll: { sq: "Shiko të Gjitha", en: "View All" },
  addToCart: { sq: "Shto në Shportë", en: "Add to Cart" },
  buyNow: { sq: "Blej Tani", en: "Buy Now" },
  checkout: { sq: "Përfundo Porosinë", en: "Checkout" },
  emptyCart: { sq: "Shporta është bosh", en: "Your cart is empty" },
  continueShopping: { sq: "Vazhdo Blerjen", en: "Continue Shopping" },
  subtotal: { sq: "Nëntotali", en: "Subtotal" },
  shipping: { sq: "Transporti", en: "Shipping" },
  total: { sq: "Totali", en: "Total" },
  freeShipping: { sq: "Falas", en: "Free" },
  quantity: { sq: "Sasia", en: "Quantity" },
  remove: { sq: "Hiq", en: "Remove" },
  fullName: { sq: "Emri i Plotë", en: "Full Name" },
  phone: { sq: "Numri i Telefonit", en: "Phone Number" },
  email: { sq: "Email (opsionale)", en: "Email (optional)" },
  city: { sq: "Qyteti", en: "City" },
  address: { sq: "Adresa", en: "Address" },
  postalCode: { sq: "Kodi Postar (opsionale)", en: "Postal Code (optional)" },
  orderNotes: { sq: "Shënime për porosinë (opsionale)", en: "Order Notes (optional)" },
  paymentMethod: { sq: "Mënyra e Pagesës", en: "Payment Method" },
  cod: { sq: "Pagesë në Dorëzim", en: "Cash on Delivery" },
  codDesc: { sq: "Paguani kur porosia të mbërrijë tek ju", en: "Pay when your order is delivered" },
  placeOrder: { sq: "Dërgo Porosinë", en: "Place Order" },
  orderConfirmed: { sq: "Porosia u Konfirmua!", en: "Order Confirmed!" },
  orderNumber: { sq: "Numri i Porosisë", en: "Order Number" },
  thankYou: { sq: "Faleminderit për porosinë. Do t'ju kontaktojmë së shpejti.", en: "Thank you for your order. We will contact you soon." },
  contactPhone: { sq: "+383 44 123 456", en: "+383 44 123 456" },
  admin: { sq: "Admin", en: "Admin" },
  logout: { sq: "Dilni", en: "Logout" },
  login: { sq: "Kyçu", en: "Sign In" },
  password: { sq: "Fjalëkalimi", en: "Password" },
  orders: { sq: "Porositë", en: "Orders" },
  status: { sq: "Statusi", en: "Status" },
  search: { sq: "Kërko...", en: "Search..." },
  allStatuses: { sq: "Të gjitha statuset", en: "All statuses" },
  pending: { sq: "Në pritje", en: "Pending" },
  confirmed: { sq: "E konfirmuar", en: "Confirmed" },
  processing: { sq: "Në përpunim", en: "Processing" },
  shipped: { sq: "E dërguar", en: "Shipped" },
  delivered: { sq: "E dorëzuar", en: "Delivered" },
  cancelled: { sq: "E anuluar", en: "Cancelled" },
  printInvoice: { sq: "Printo Faturën", en: "Print Invoice" },
  customer: { sq: "Klienti", en: "Customer" },
  date: { sq: "Data", en: "Date" },
  items: { sq: "Artikujt", en: "Items" },
  heroTitle: { sq: "Bukuri profesionale, dorëzuar tek ju", en: "Professional beauty, delivered to you" },
  heroSubtitle: { sq: "Kujdesi për flokë, barber, thonj, grim, mobilje e pajisje — pagesë vetëm në dorëzim.", en: "Hair care, barber, nails, makeup, furniture & equipment — Cash on Delivery only." },
  shopNow: { sq: "Blej Tani", en: "Shop Now" },
  outOfStock: { sq: "Pa stok", en: "Out of stock" },
  allProducts: { sq: "Të gjitha produktet", en: "All products" },
  noProducts: { sq: "Asnjë produkt", en: "No products found" },
  invoice: { sq: "Faturë", en: "Invoice" },
  updateStatus: { sq: "Ndrysho Statusin", en: "Update Status" },
  filter: { sq: "Filtro", en: "Filter" },
  back: { sq: "Kthehu", en: "Back" },
  footerNote: { sq: "© Bella Salon Supplies. Pagesë vetëm në dorëzim.", en: "© Bella Salon Supplies. Cash on Delivery only." },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: (k: keyof typeof t) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sq");
  useEffect(() => {
    const saved = (typeof window !== "undefined" ? localStorage.getItem("lang") : null) as Lang | null;
    if (saved === "sq" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  const tr = (k: keyof typeof t) => t[k]?.[lang] ?? String(k);
  return <I18nCtx.Provider value={{ lang, setLang, tr }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
