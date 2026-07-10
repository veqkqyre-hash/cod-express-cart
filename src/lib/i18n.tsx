import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "sq" | "en";

type Dict = Record<string, { sq: string; en: string }>;

export const t: Dict = {
  brand: { sq: "Dream Studio", en: "Dream Studio" },
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
  cod: { sq: "Pagesë në Dorëzim (Postë)", en: "Cash on Delivery (Post)" },
  codDesc: { sq: "Paguani kur produkti t'ju vijë me postë", en: "Pay when the product arrives by post" },
  placeOrder: { sq: "Dërgo Porosinë", en: "Place Order" },
  orderConfirmed: { sq: "Porosia u Konfirmua!", en: "Order Confirmed!" },
  orderNumber: { sq: "Numri i Porosisë", en: "Order Number" },
  thankYou: { sq: "Faleminderit për porosinë. Do t'ju kontaktojmë së shpejti.", en: "Thank you for your order. We will contact you soon." },
  contactPhone: { sq: "+383 44 123 456", en: "+383 44 123 456" },
  admin: { sq: "Admin", en: "Admin" },
  logout: { sq: "Dilni", en: "Logout" },
  login: { sq: "Kyçu", en: "Sign In" },
  signUp: { sq: "Regjistrohu", en: "Sign Up" },
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
  heroSubtitle: { sq: "Kujdesi për flokë, barber, thonj, grim, mobilje e pajisje — paguani kur produkti vjen me postë.", en: "Hair care, barber, nails, makeup, furniture & equipment — pay when your parcel arrives." },
  shopNow: { sq: "Blej Tani", en: "Shop Now" },
  outOfStock: { sq: "Pa stok", en: "Out of stock" },
  allProducts: { sq: "Të gjitha produktet", en: "All products" },
  noProducts: { sq: "Asnjë produkt", en: "No products found" },
  invoice: { sq: "Faturë", en: "Invoice" },
  updateStatus: { sq: "Ndrysho Statusin", en: "Update Status" },
  filter: { sq: "Filtro", en: "Filter" },
  back: { sq: "Kthehu", en: "Back" },
  footerNote: { sq: "© Dream Studio. Pagesë në dorëzim me postë.", en: "© Dream Studio. Cash on Delivery via post." },
  account: { sq: "Llogaria Ime", en: "My Account" },
  myOrders: { sq: "Porositë e Mia", en: "My Orders" },
  loginRequired: { sq: "Kyçuni për të vazhduar", en: "Sign in to continue" },
  loginToCheckout: { sq: "Duhet të kyçeni ose të regjistroheni për të përfunduar porosinë.", en: "You need to sign in or register to place an order." },
  products: { sq: "Produktet", en: "Products" },
  addProduct: { sq: "Shto Produkt", en: "Add Product" },
  editProduct: { sq: "Ndrysho Produktin", en: "Edit Product" },
  deleteConfirm: { sq: "A jeni i sigurt?", en: "Are you sure?" },
  save: { sq: "Ruaj", en: "Save" },
  cancel: { sq: "Anulo", en: "Cancel" },
  price: { sq: "Çmimi", en: "Price" },
  stock: { sq: "Stoku", en: "Stock" },
  category: { sq: "Kategoria", en: "Category" },
  imageUrl: { sq: "URL e Fotos", en: "Image URL" },
  descriptionLabel: { sq: "Përshkrimi", en: "Description" },
  productName: { sq: "Emri i Produktit", en: "Product Name" },
  active: { sq: "Aktiv", en: "Active" },
  featuredLabel: { sq: "I Zgjedhur", en: "Featured" },
  noOrders: { sq: "Nuk keni porosi ende", en: "No orders yet" },
  admins: { sq: "Adminët", en: "Admins" },
  addAdmin: { sq: "Shto Admin", en: "Add Admin" },
  adminEmail: { sq: "Email i adminit të ri", en: "New admin email" },
  revoke: { sq: "Hiq", en: "Revoke" },
  adminAdded: { sq: "Admini u shtua", en: "Admin added" },
  adminRemoved: { sq: "Admini u hoq", en: "Admin removed" },
  redirecting: { sq: "Duke ju ridrejtuar…", en: "Redirecting…" },
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
