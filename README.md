# Simple Checkout

Update the e-commerce website to use Cash on Delivery (COD) as the only payment method.

Requirements:

Remove all online payment gateways (Stripe, PayPal, credit cards, Apple Pay, Google Pay).

During checkout, customers only need to enter:

Full Name

Phone Number

Email (optional)

City

Address

Postal Code (optional)

Order Notes (optional)

Checkout should display:

Payment Method

Cash on Delivery (Pay when your order is delivered)

Order Flow:

Customer adds products to cart.

Customer completes checkout form.

Order is submitted.

Admin receives the order in the dashboard.

Customer sees an Order Confirmation page with the order number.

Admin Dashboard:

View Orders

Change Order Status:

Pending

Confirmed

Processing

Shipped

Delivered

Cancelled

Search and filter orders

Print invoice or packing slip

The checkout experience should be simple, clean, and optimized for mobile devices to maximize conversions.



me duhet ni website qisi

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cod-express-cart.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/af0b446d-a548-47df-b3c6-269e27c390c6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
