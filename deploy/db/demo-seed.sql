-- SystIO Land — mirrors the APK's demo dataset (mobile/src/data/demoData.ts)
-- into the self-hosted PostgreSQL database, with stable UUIDs so it can be
-- re-run safely. Approved properties appear in the app's public listings feed;
-- pending/declined ones are visible in the admin dashboard.
--
-- Run as the app DB role:
--   PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -U landapp -d land_app \
--     -v ON_ERROR_STOP=1 -f deploy/db/demo-seed.sql

create or replace function pg_temp.demo_img(p text)
returns text language sql immutable as $$
  select 'https://images.unsplash.com/' || p || '?auto=format&fit=crop&w=1200&q=80';
$$;

-- Clear only the rows this seed owns (real user data is untouched).
delete from public.payments  where id::text like '00000000-0000-4000-8000-000000002%';
delete from public.properties where id::text like '00000000-0000-4000-8000-000000001%';
delete from public.profiles   where id::text like '00000000-0000-4000-8000-000000000%';

-- ---------------------------------------------------------------------------
-- Demo owner profiles
-- ---------------------------------------------------------------------------
insert into public.profiles
  (id, phone, name, role, free_listing_used, onboarding_completed, phone_verified, created_at)
values
  ('00000000-0000-4000-8000-000000000001', '+919822014563', 'Rohit Deshmukh', 'broker', true,  true, true, now() - interval '380 days'),
  ('00000000-0000-4000-8000-000000000002', '+919823045671', 'Sneha Kulkarni', 'owner',  true,  true, true, now() - interval '310 days'),
  ('00000000-0000-4000-8000-000000000003', '+919820117845', 'Imran Shaikh',   'broker', true,  true, true, now() - interval '260 days'),
  ('00000000-0000-4000-8000-000000000004', '+919922453310', 'Anjali Patil',   'owner',  true,  true, true, now() - interval '210 days'),
  ('00000000-0000-4000-8000-000000000005', '+919835478901', 'Vikram Singh',   'owner',  false, true, true, now() - interval '150 days'),
  ('00000000-0000-4000-8000-000000000006', '+919811223344', 'Rakesh Sharma',  'broker', true,  true, true, now() - interval '120 days'),
  ('00000000-0000-4000-8000-000000000007', '+919845671230', 'Meera Iyer',     'broker', true,  true, true, now() - interval '95 days'),
  ('00000000-0000-4000-8000-000000000008', '+919701267812', 'Arjun Nair',     'owner',  false, true, true, now() - interval '60 days');

-- ---------------------------------------------------------------------------
-- Demo properties (same titles, prices, photos, boundaries and landmarks)
-- ---------------------------------------------------------------------------
insert into public.properties
  (id, owner_id, title, description, listing_type, property_type, price, area_value,
   area_unit, address, locality, city, state, pincode, latitude, longitude,
   boundary, images, youtube_url, nearby_landmarks, status, admin_note,
   is_featured, views_count, created_at, updated_at)
values
  (
    '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000001',
    'East-facing NA plot in Wagholi',
    'A clean, ready-to-register NA plot on a 30 ft internal road. The plot is east-facing, fenced on three sides and has a clear title. Walking distance from the new Wagholi ring-road connector, schools and daily-needs market. Ideal for a single-family home or a small rental project.',
    'sale', 'plot', 4500000, 2500, 'sqft',
    'Plot 14, Ganesh Nagar, Wagholi', 'Wagholi', 'Pune', 'Maharashtra', '412207',
    18.5793, 73.9822,
    '[{"latitude":18.57965,"longitude":73.98185},{"latitude":18.57965,"longitude":73.98255},{"latitude":18.57905,"longitude":73.98255},{"latitude":18.57905,"longitude":73.98185}]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1500382017468-9049fed747ef'), pg_temp.demo_img('photo-1500530855697-b586d89ba3ee'), pg_temp.demo_img('photo-1470770841072-f978cf4d019e'), pg_temp.demo_img('photo-1524813686514-a57563d77965')]::text[],
    'https://www.youtube.com/@systioland',
    '[{"name":"Wagholi market","distance":"800 m"},{"name":"Lexicon International School","distance":"1.2 km"},{"name":"Pune–Ahmednagar highway","distance":"2 km"}]'::jsonb,
    'approved', null, true, 342, now() - interval '18 days', now() - interval '17 days'
  ),
  (
    '00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000002',
    'Sunlit 3 BHK near Hinjewadi IT park',
    'A bright, east-facing 3 BHK in a gated society with a clubhouse, covered parking and 24×7 security. The flat has a large living room, modular kitchen, three balconies and is walking distance from Phase 2 of Hinjewadi IT Park. Society dues are clear and the property is ready for immediate registration.',
    'sale', 'flat', 8500000, 1450, 'sqft',
    'Tower B, Blue Ridge, Hinjewadi Phase 2', 'Hinjewadi', 'Pune', 'Maharashtra', '411057',
    18.5913, 73.738,
    '[]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1600585154340-be6161a56a0c'), pg_temp.demo_img('photo-1600607687939-ce8a6c25118c'), pg_temp.demo_img('photo-1600566753086-00f18fb6b3ea'), pg_temp.demo_img('photo-1600607687920-4e2a09cf159d')]::text[],
    null,
    '[{"name":"Hinjewadi IT Park Phase 2","distance":"1.5 km"},{"name":"Ruby Hall Clinic","distance":"2.4 km"},{"name":"Blue Ridge Mall","distance":"500 m"}]'::jsonb,
    'approved', null, true, 512, now() - interval '12 days', now() - interval '11 days'
  ),
  (
    '00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000004',
    '2.5 acre farm land with borewell',
    'Fertile red-soil farm land with a working borewell, electricity connection and a 20 ft tar road frontage. Currently planted with seasonal vegetables. Clear 7/12 extract, no encumbrance. Perfect for a weekend farmhouse or horticulture project.',
    'sale', 'agricultural', 12000000, 2.5, 'acre',
    'Gat No. 118, Dindori Road', 'Dindori', 'Nashik', 'Maharashtra', '422202',
    20.0005, 73.8325,
    '[{"latitude":20.0021,"longitude":73.831},{"latitude":20.0021,"longitude":73.834},{"latitude":19.9988,"longitude":73.834},{"latitude":19.9988,"longitude":73.831}]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1470770841072-f978cf4d019e'), pg_temp.demo_img('photo-1524813686514-a57563d77965'), pg_temp.demo_img('photo-1493246507139-91e8fad9978e'), pg_temp.demo_img('photo-1500530855697-b586d89ba3ee')]::text[],
    'https://www.youtube.com/@systioland',
    '[{"name":"Dindori market","distance":"2 km"},{"name":"Nashik–Trimbak road","distance":"3.5 km"},{"name":"Primary health centre","distance":"1.8 km"}]'::jsonb,
    'approved', null, true, 287, now() - interval '24 days', now() - interval '22 days'
  ),
  (
    '00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000000003',
    'Compact commercial shop in Kharadi',
    'Ground-floor shop in a busy residential pocket, suitable for a café, clinic or boutique. Glass frontage, separate washroom, 24×7 water and three-phase power. Main-road visibility with easy parking in front. Available immediately on a 3-year lease.',
    'rent', 'commercial', 65000, 850, 'sqft',
    'Shop 6, Gera''s Imperium Rise, Kharadi', 'Kharadi', 'Pune', 'Maharashtra', '411014',
    18.5515, 73.9477,
    '[]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1497366216548-37526070297c'), pg_temp.demo_img('photo-1497366811353-6870744d04b2'), pg_temp.demo_img('photo-1524758631624-e2822e304c36'), pg_temp.demo_img('photo-1600607687939-ce8a6c25118c')]::text[],
    null,
    '[{"name":"EON IT Park","distance":"1 km"},{"name":"Kharadi Bypass","distance":"1.5 km"},{"name":"Phoenix Marketcity","distance":"2.8 km"}]'::jsonb,
    'approved', null, false, 188, now() - interval '9 days', now() - interval '8 days'
  ),
  (
    '00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-000000000006',
    'Independent villa with terrace garden in Baner',
    'A beautifully maintained 4 BHK villa in a quiet Baner lane. Double-height living room, private lift, landscaped terrace and two covered car parks. The villa is vastu-compliant with a north-east entry and sits on a 2,400 sq ft plot. No society maintenance; individual water tank and solar water heater installed.',
    'sale', 'house', 34000000, 3200, 'sqft',
    'Lane 7, Sagar Society, Baner', 'Baner', 'Pune', 'Maharashtra', '411045',
    18.5595, 73.7815,
    '[]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1600596542815-ffad4c1539a9'), pg_temp.demo_img('photo-1600585154340-be6161a56a0c'), pg_temp.demo_img('photo-1512917774080-9991f1c4c750'), pg_temp.demo_img('photo-1600566753086-00f18fb6b3ea')]::text[],
    'https://www.youtube.com/@systioland',
    '[{"name":"Baner Balewadi high street","distance":"1.1 km"},{"name":"Jupiter Hospital","distance":"2.3 km"},{"name":"Mumbai–Bengaluru highway","distance":"3 km"}]'::jsonb,
    'approved', null, true, 780, now() - interval '6 days', now() - interval '5 days'
  ),
  (
    '00000000-0000-4000-8000-000000001006', '00000000-0000-4000-8000-000000000005',
    '5 kattha corner land near Ring Road',
    'A rare corner plot on the new ring-road service lane, 5 kattha in total with a 40 ft approach road. The land is plain, ready for construction and surrounded by newly built homes. Clear title with a single owner. This is the first listing on SystIO Land and the documents are available on request.',
    'sale', 'plot', 3500000, 5, 'kattha',
    'Near Radha Krishna Mandir, Ring Road', 'Tilkamanjhi', 'Bhagalpur', 'Bihar', '812001',
    25.2425, 86.9842,
    '[{"latitude":25.2429,"longitude":86.9838},{"latitude":25.2429,"longitude":86.9847},{"latitude":25.2418,"longitude":86.9847},{"latitude":25.2418,"longitude":86.9838}]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1500530855697-b586d89ba3ee'), pg_temp.demo_img('photo-1493246507139-91e8fad9978e'), pg_temp.demo_img('photo-1470770841072-f978cf4d019e'), pg_temp.demo_img('photo-1510798831971-661eb04b3739')]::text[],
    null,
    '[{"name":"Ring Road crossing","distance":"350 m"},{"name":"Radha Krishna Mandir","distance":"500 m"},{"name":"Tilkamanjhi market","distance":"2.1 km"}]'::jsonb,
    'approved', null, false, 201, now() - interval '30 days', now() - interval '28 days'
  ),
  (
    '00000000-0000-4000-8000-000000001007', '00000000-0000-4000-8000-000000000007',
    '2 BHK apartment in Kothrud',
    'Semi-furnished 2 BHK on the fifth floor with uninterrupted views and a covered balcony. Includes wardrobes, two ACs, chimney and modular kitchen. Family-only society with lift, power backup and dedicated parking. Close to Karve Road and the metro line.',
    'rent', 'flat', 28000, 1050, 'sqft',
    'Shivsagar Residency, Kothrud', 'Kothrud', 'Pune', 'Maharashtra', '411038',
    18.5074, 73.8077,
    '[]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1522708323590-d24dbb6b0267'), pg_temp.demo_img('photo-1502672260266-1c1ef2d93688'), pg_temp.demo_img('photo-1560448204-e02f11c3d0e2'), pg_temp.demo_img('photo-1600607687920-4e2a09cf159d')]::text[],
    null,
    '[{"name":"Karve Road metro station","distance":"900 m"},{"name":"Deenanath Mangeshkar Hospital","distance":"2 km"},{"name":"City Pride theatre","distance":"1.4 km"}]'::jsonb,
    'approved', null, false, 165, now() - interval '4 days', now() - interval '3 days'
  ),
  (
    '00000000-0000-4000-8000-000000001008', '00000000-0000-4000-8000-000000000008',
    'Mango orchard farmhouse near Shamirpet',
    'A serene 5-acre mango orchard with a 2 BHK farmhouse, borewell, solar fencing and a tractor shed. 120 healthy mango trees with drip irrigation. Excellent for weekend living or a boutique farm-stay. Approach road is fully tarred up to the gate.',
    'sale', 'agricultural', 28000000, 5, 'acre',
    'Survey 44, Shamirpet outskirts', 'Shamirpet', 'Hyderabad', 'Telangana', '500078',
    17.6025, 78.5605,
    '[{"latitude":17.604,"longitude":78.559},{"latitude":17.604,"longitude":78.562},{"latitude":17.6005,"longitude":78.562},{"latitude":17.6005,"longitude":78.559}]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1510798831971-661eb04b3739'), pg_temp.demo_img('photo-1493246507139-91e8fad9978e'), pg_temp.demo_img('photo-1524813686514-a57563d77965'), pg_temp.demo_img('photo-1470770841072-f978cf4d019e')]::text[],
    'https://www.youtube.com/@systioland',
    '[{"name":"Shamirpet lake","distance":"2.4 km"},{"name":"ORR exit 4","distance":"4 km"},{"name":"Genome Valley","distance":"6 km"}]'::jsonb,
    'approved', null, false, 97, now() - interval '2 days', now() - interval '2 days'
  ),
  (
    '00000000-0000-4000-8000-000000001009', '00000000-0000-4000-8000-000000000006',
    'Premium corner plot in Dhanori',
    'Corner plot in a fast-developing Dhanori pocket, 2,000 sq ft with a 25 ft internal road. Excellent for a duplex or small apartment building. All approvals in place and ready for immediate transfer.',
    'sale', 'plot', 5500000, 2000, 'sqft',
    'Dhanori road, near New Poona School', 'Dhanori', 'Pune', 'Maharashtra', '411015',
    18.5896, 73.9031,
    '[{"latitude":18.5899,"longitude":73.9027},{"latitude":18.5899,"longitude":73.9035},{"latitude":18.5893,"longitude":73.9035},{"latitude":18.5893,"longitude":73.9027}]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1493246507139-91e8fad9978e'), pg_temp.demo_img('photo-1500530855697-b586d89ba3ee'), pg_temp.demo_img('photo-1510798831971-661eb04b3739'), pg_temp.demo_img('photo-1470770841072-f978cf4d019e')]::text[],
    null,
    '[{"name":"New Poona School","distance":"700 m"},{"name":"Dhanori market","distance":"1.5 km"},{"name":"Lohegaon airport","distance":"3.8 km"}]'::jsonb,
    'pending', null, false, 0, now() - interval '1 day', now() - interval '1 day'
  ),
  (
    '00000000-0000-4000-8000-00000000100a', '00000000-0000-4000-8000-000000000003',
    'Furnished office space in Andheri East',
    'Plug-and-play office for a team of 22–25, with cabins, a meeting room, pantry and 18 workstations. Located in a grade-A building with 24×7 access, two lifts and visitor parking. Rent includes furniture and CAM.',
    'rent', 'commercial', 140000, 1800, 'sqft',
    'Unit 704, Times Square, Andheri East', 'Andheri East', 'Mumbai', 'Maharashtra', '400059',
    19.1136, 72.8697,
    '[]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1497366811353-6870744d04b2'), pg_temp.demo_img('photo-1497366216548-37526070297c'), pg_temp.demo_img('photo-1524758631624-e2822e304c36'), pg_temp.demo_img('photo-1560448204-e02f11c3d0e2')]::text[],
    null,
    '[{"name":"Andheri metro station","distance":"1.2 km"},{"name":"Chhatrapati Shivaji airport","distance":"4.5 km"},{"name":"SEEPZ","distance":"2.8 km"}]'::jsonb,
    'pending', null, false, 0, now() - interval '1 day', now() - interval '1 day'
  ),
  (
    '00000000-0000-4000-8000-00000000100b', '00000000-0000-4000-8000-000000000002',
    '3 BHK row house in Wakad',
    'Spacious row house in a gated complex with a private garden. Three bedrooms on the first floor, a large living and dining area on the ground floor, and a utility room. Clubhouse, pool and play area are part of the society.',
    'sale', 'house', 13500000, 2100, 'sqft',
    'Row 4, Kalpataru Estate, Wakad', 'Wakad', 'Pune', 'Maharashtra', '411057',
    18.5983, 73.7626,
    '[]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1568605114967-8130f3a36994'), pg_temp.demo_img('photo-1600047509807-ba8f99d2cdde'), pg_temp.demo_img('photo-1580587771525-78b9dba3b914'), pg_temp.demo_img('photo-1600585154340-be6161a56a0c')]::text[],
    null,
    '[{"name":"Wakad bridge","distance":"1.3 km"},{"name":"Aditya Birla hospital","distance":"3.1 km"},{"name":"Xion Mall","distance":"1.9 km"}]'::jsonb,
    'pending', null, false, 0, now() - interval '1 day', now() - interval '1 day'
  ),
  (
    '00000000-0000-4000-8000-00000000100c', '00000000-0000-4000-8000-000000000004',
    '1 acre grape farm near Dindori',
    'A well-kept 1-acre grape farm with a drip system, two borewells and a small storage shed. The current season''s vines are healthy. Price is negotiable for a quick, clean transfer.',
    'sale', 'agricultural', 6500000, 1, 'acre',
    'Gat 72, Janori Road', 'Janori', 'Nashik', 'Maharashtra', '422206',
    20.0728, 73.8821,
    '[]'::jsonb,
    ARRAY[pg_temp.demo_img('photo-1524813686514-a57563d77965'), pg_temp.demo_img('photo-1510798831971-661eb04b3739'), pg_temp.demo_img('photo-1500382017468-9049fed747ef'), pg_temp.demo_img('photo-1470770841072-f978cf4d019e')]::text[],
    null,
    '[{"name":"Janori village","distance":"1 km"}]'::jsonb,
    'declined',
    'Please add a clearer cover photo of the farm and mention the water source in the description before re-submitting.',
    false, 0, now() - interval '5 days', now() - interval '4 days'
  );

-- ---------------------------------------------------------------------------
-- Demo payments
-- ---------------------------------------------------------------------------
insert into public.payments
  (id, user_id, property_id, razorpay_order_id, razorpay_payment_id, amount,
   currency, status, kind, created_at, paid_at)
values
  ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000001001', null, null, 0, 'INR', 'paid', 'free_listing', now() - interval '18 days', now() - interval '18 days'),
  ('00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000001002', null, null, 0, 'INR', 'paid', 'free_listing', now() - interval '12 days', now() - interval '12 days'),
  ('00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000001003', null, null, 0, 'INR', 'paid', 'free_listing', now() - interval '24 days', now() - interval '24 days'),
  ('00000000-0000-4000-8000-000000002004', '00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000001009', 'order_SEED9X2',  'pay_SEED9X2',  10000, 'INR', 'paid', 'listing_fee', now() - interval '1 day', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000002005', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-00000000100a', 'order_SEED10Q4', 'pay_SEED10Q4', 10000, 'INR', 'paid', 'listing_fee', now() - interval '1 day', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000002006', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-00000000100b', 'order_SEED11K7', 'pay_SEED11K7', 10000, 'INR', 'paid', 'listing_fee', now() - interval '1 day', now() - interval '1 day');

-- Summary
select
  (select count(*) from public.profiles)  as profiles,
  (select count(*) from public.properties) as properties,
  (select count(*) from public.payments)   as payments;
