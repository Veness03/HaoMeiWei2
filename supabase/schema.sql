-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('admin', 'owner', 'cashier', 'staff')) not null default 'staff',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Menu Items
create table menu_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  chinese_name text,
  category text not null,
  price numeric(10,2) not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Sales
create table sales (
  id uuid default uuid_generate_v4() primary key,
  cashier_id uuid references profiles(id),
  total_amount numeric(10,2) not null default 0,
  payment_method text default 'cash',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Sales Items
create table sales_items (
  id uuid default uuid_generate_v4() primary key,
  sale_id uuid references sales(id) on delete cascade not null,
  menu_item_id uuid references menu_items(id),
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Expenses
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  category text not null,
  amount numeric(10,2) not null,
  expense_date date not null default current_date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Suppliers
create table suppliers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contact_info text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Stock Items
create table stock_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  chinese_name text,
  unit text not null,
  current_quantity numeric(10,2) not null default 0,
  minimum_quantity numeric(10,2) not null default 0,
  cost_per_unit numeric(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Stock Movements
create table stock_movements (
  id uuid default uuid_generate_v4() primary key,
  stock_item_id uuid references stock_items(id) on delete cascade not null,
  movement_type text check (movement_type in ('purchase', 'usage', 'waste', 'adjustment')) not null,
  quantity numeric(10,2) not null,
  unit_cost numeric(10,2),
  total_cost numeric(10,2),
  supplier_id uuid references suppliers(id),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table menu_items enable row level security;
alter table sales enable row level security;
alter table sales_items enable row level security;
alter table expenses enable row level security;
alter table suppliers enable row level security;
alter table stock_items enable row level security;
alter table stock_movements enable row level security;

-- Policies Examples (Simplified)

-- Profiles: Users can read all profiles, update their own. Admins can update all.
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Menu Items: Everyone authenticated can read. Admins/owners can alter.
create policy "Menu items viewable by authenticated users" on menu_items for select using (auth.role() = 'authenticated');
create policy "Menu items insertable by admins" on menu_items for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner'))
);
create policy "Menu items updatable by admins" on menu_items for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner'))
);

-- Sales & Sales Items: Viewable by all authenticated. Insertable by cashier, admin, owner.
create policy "Sales viewable by auth" on sales for select using (auth.role() = 'authenticated');
create policy "Sales insertable by authorized" on sales for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner', 'cashier'))
);

create policy "Sales items viewable by auth" on sales_items for select using (auth.role() = 'authenticated');
create policy "Sales items insertable by authorized" on sales_items for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner', 'cashier'))
);

-- Expenses: Viewable by admin/owner. Insertable by admin/owner.
create policy "Expenses viewable by admins" on expenses for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner'))
);
create policy "Expenses insertable by admins" on expenses for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner'))
);

-- Stock: Viewable by auth. Insertable by all auth (for usage), admin/owner (for purchase/adjustment).
create policy "Stock items viewable by auth" on stock_items for select using (auth.role() = 'authenticated');
create policy "Stock items all operations by expected roles" on stock_items for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner', 'staff', 'cashier'))
);

create policy "Stock movements viewable by auth" on stock_movements for select using (auth.role() = 'authenticated');
create policy "Stock movements insertable by auth" on stock_movements for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner', 'staff', 'cashier'))
);

-- Handle New User Registration Trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
