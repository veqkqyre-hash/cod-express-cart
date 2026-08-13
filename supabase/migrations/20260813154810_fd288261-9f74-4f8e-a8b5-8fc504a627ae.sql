-- deactivate demo products of non-nail categories and unlink them
update public.products p set active = false, category_id = null
where category_id in (select id from public.categories where slug not in ('nails'));

delete from public.categories where slug not in ('nails');

update public.categories set name_sq = 'Gel Lak', name_en = 'Gel Polish', slug = 'gel-lak', sort_order = 10 where slug = 'nails';

insert into public.categories (slug, name_sq, name_en, sort_order) values
  ('akrilik-pluhur', 'Akrilik & Pluhur', 'Acrylic & Powder', 20),
  ('gel-thonj', 'Gel për Thonj', 'Builder Gel', 30),
  ('baze-top-coat', 'Bazë & Top Coat', 'Base & Top Coat', 40),
  ('freza-aparate', 'Freza & Aparate', 'Drills & Machines', 50),
  ('lampa-uv-led', 'Lampa UV/LED', 'UV/LED Lamps', 60),
  ('lime-instrumente', 'Limë & Instrumente', 'Files & Tools', 70),
  ('tipsa-forma', 'Tipsa & Forma', 'Tips & Forms', 80),
  ('nail-art', 'Nail Art & Dekor', 'Nail Art & Decor', 90),
  ('pedikyr', 'Pedikyr', 'Pedicure', 100),
  ('higjena', 'Higjenë & Dezinfektim', 'Hygiene & Disinfection', 110)
on conflict do nothing;