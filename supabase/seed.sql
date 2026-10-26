insert into public.cities (id, name, description, image_url)
values (
  '10000000-0000-4000-8000-000000000001',
  'Dresden',
  'Baroque architecture, riverside walks, and quiet courtyards make Dresden a lovely city to explore at your own pace.',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85'
)
on conflict (id) do nothing;

insert into public.attractions (id, city_id, name, description, image_url, sort_order)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Frauenkirche',
    'See Dresden’s landmark church on Neumarkt, then take in the city rooftops from its viewing platform.',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=85',
    1
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Zwinger Palace',
    'Wander through the Baroque courtyards and galleries of one of Dresden’s best-known landmarks.',
    'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=1000&q=85',
    2
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Brühl’s Terrace',
    'Take a relaxed walk above the Elbe and enjoy views across the river toward Neustadt.',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85',
    3
  )
on conflict (id) do nothing;
