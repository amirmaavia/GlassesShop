-- Draft integration migration. Review and apply in a new Supabase project only.
-- Auth profiles and roles must be provisioned by a trusted server, never clients.
create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users on delete cascade, name text not null, role text not null default 'customer' check(role in ('customer','admin')), active boolean not null default true, created_at timestamptz not null default now());
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin' and active) $$;
create table public.user_addresses (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, address jsonb not null);
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique, enabled boolean not null default true);
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid references categories, slug text unique not null, name text not null, description text not null, shape text not null, material text not null, price integer not null check(price>=0), compare_at integer check(compare_at>=0), measurements jsonb not null default '{}', published boolean not null default false, featured boolean not null default false, created_at timestamptz not null default now());
create table public.product_variants (id uuid primary key default gen_random_uuid(), product_id uuid not null references products on delete cascade, colour text not null, stock integer not null default 0 check(stock>=0), low_stock_threshold integer not null default 5 check(low_stock_threshold>=0), unique(product_id,colour));
create table public.product_images (id uuid primary key default gen_random_uuid(), product_id uuid not null references products on delete cascade, variant_id uuid references product_variants, path text not null, alt text not null, position integer not null default 0);
create table public.lens_options (id uuid primary key default gen_random_uuid(), product_id uuid references products on delete cascade, type text not null, material text not null, price integer not null check(price>=0), requires_prescription boolean not null default false, rules jsonb not null default '{}');
create table public.lens_addons (id uuid primary key default gen_random_uuid(), name text not null, price integer not null check(price>=0), compatibility jsonb not null default '{}');
create table public.prescriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, private_file_path text, values jsonb, status text not null default 'pending', created_at timestamptz not null default now());
create table public.carts (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references profiles on delete cascade);
create table public.cart_items (id uuid primary key default gen_random_uuid(), cart_id uuid not null references carts on delete cascade, variant_id uuid not null references product_variants, configuration jsonb not null, quantity integer not null check(quantity between 1 and 20));
create table public.discounts (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, percent numeric not null default 0 check(percent between 0 and 100), fixed integer not null default 0 check(fixed>=0), minimum integer not null default 0, starts_at timestamptz not null, ends_at timestamptz not null, usage_limit integer not null check(usage_limit>0), per_customer integer not null default 1 check(per_customer>0), active boolean not null default true, rules jsonb not null default '{}', check(ends_at>=starts_at));
create table public.orders (id uuid primary key default gen_random_uuid(), order_number text unique not null, user_id uuid not null references profiles, address_snapshot jsonb not null, subtotal integer not null check(subtotal>=0), discount integer not null default 0 check(discount>=0), shipping integer not null check(shipping>=0), tax integer not null default 0 check(tax>=0), total integer not null check(total>=0), promotion_snapshot jsonb, payment_method text not null, payment_status text not null default 'unpaid', status text not null default 'Pending' check(status in ('Pending','Confirmed','Processing','Ready to Ship','Shipped','Delivered','Cancelled','Returned')), created_at timestamptz not null default now());
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references orders on delete cascade, product_id uuid references products on delete set null, variant_id uuid references product_variants on delete set null, prescription_id uuid references prescriptions, product_snapshot jsonb not null, lens_snapshot jsonb not null, unit_price integer not null check(unit_price>=0), quantity integer not null check(quantity>0));
create table public.discount_redemptions (id uuid primary key default gen_random_uuid(), discount_id uuid not null references discounts, user_id uuid not null references profiles, order_id uuid unique not null references orders, created_at timestamptz not null default now());
create table public.inventory_movements (id uuid primary key default gen_random_uuid(), variant_id uuid not null references product_variants, order_id uuid references orders, quantity_delta integer not null, reason text not null, actor_id uuid references profiles, created_at timestamptz not null default now());
create table public.wishlists (id uuid primary key default gen_random_uuid(), user_id uuid unique not null references profiles on delete cascade);
create table public.wishlist_items (wishlist_id uuid references wishlists on delete cascade, product_id uuid references products on delete cascade, primary key(wishlist_id,product_id));
create table public.reviews (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles, product_id uuid not null references products, order_item_id uuid unique references order_items, rating integer not null check(rating between 1 and 5), content text not null, approved boolean not null default false, created_at timestamptz not null default now());
create table public.support_tickets (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles, message text not null, status text not null default 'Open', created_at timestamptz not null default now());
create table public.store_settings (id text primary key default 'default', public_settings jsonb not null default '{}');
create table public.homepage_sections (id uuid primary key default gen_random_uuid(), type text not null, position integer not null, enabled boolean not null default true, content jsonb not null);
create table public.admin_audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid not null references profiles, action text not null, entity_id text, details jsonb not null default '{}', created_at timestamptz not null default now());
create index orders_owner_date on orders(user_id,created_at desc);
create index order_items_order on order_items(order_id);
create index products_category_published on products(category_id,published);
create index variants_product on product_variants(product_id);
create index redemptions_owner_discount on discount_redemptions(user_id,discount_id);
create index prescriptions_owner on prescriptions(user_id);
create index addresses_owner on user_addresses(user_id);
create index inventory_variant_date on inventory_movements(variant_id,created_at desc);

-- Default-deny all tables; explicit ownership and admin grants below.
do $$ declare t text; begin foreach t in array array['profiles','user_addresses','categories','products','product_variants','product_images','lens_options','lens_addons','prescriptions','carts','cart_items','discounts','orders','order_items','discount_redemptions','inventory_movements','wishlists','wishlist_items','reviews','support_tickets','store_settings','homepage_sections','admin_audit_logs'] loop execute format('alter table public.%I enable row level security',t); execute format('create policy admin_access on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',t); end loop; end $$;
create policy own_profile_read on profiles for select to authenticated using(id=auth.uid());
-- Updates to role/active stay server-only. A restricted RPC should handle customer name edits.
create policy own_addresses on user_addresses for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy published_categories on categories for select using(enabled);
create policy published_products on products for select using(published);
create policy published_variants on product_variants for select using(exists(select 1 from products where id=product_id and published));
create policy published_images on product_images for select using(exists(select 1 from products where id=product_id and published));
create policy public_lenses on lens_options for select using(product_id is null or exists(select 1 from products where id=product_id and published));
create policy public_addons on lens_addons for select using(true);
create policy own_prescriptions on prescriptions for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_cart on carts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_cart_items on cart_items for all to authenticated using(exists(select 1 from carts where id=cart_id and user_id=auth.uid())) with check(exists(select 1 from carts where id=cart_id and user_id=auth.uid()));
create policy own_orders_read on orders for select to authenticated using(user_id=auth.uid());
create policy own_order_items_read on order_items for select to authenticated using(exists(select 1 from orders where id=order_id and user_id=auth.uid()));
create policy own_redemptions_read on discount_redemptions for select to authenticated using(user_id=auth.uid());
create policy own_wishlist on wishlists for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_wishlist_items on wishlist_items for all to authenticated using(exists(select 1 from wishlists where id=wishlist_id and user_id=auth.uid())) with check(exists(select 1 from wishlists where id=wishlist_id and user_id=auth.uid()));
create policy approved_reviews_read on reviews for select using(approved or user_id=auth.uid());
-- Trusted server verifies purchased order ownership before accepting reviews.
create policy own_tickets_read on support_tickets for select to authenticated using(user_id=auth.uid());
create policy own_tickets_insert on support_tickets for insert to authenticated with check(user_id=auth.uid());
create policy public_settings_read on store_settings for select using(true);
create policy public_sections_read on homepage_sections for select using(enabled);
-- No customer insert/update policies on orders, redemptions or inventory.
-- Implement these through a reviewed server-only transactional checkout RPC.
-- Configure a private storage bucket for prescriptions; never a public bucket.
