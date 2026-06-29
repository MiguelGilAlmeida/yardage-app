# Cloth & Chalk — Mobile App Plan

Planning doc for the iOS/Android companion app to the Cloth & Chalk web calculator.
Nothing has been scaffolded yet — this captures the decisions made so we can pick up
implementation on the local machine (with Xcode) next.

## Decisions made

1. **Platforms:** React Native + Expo. One codebase compiles to both iOS and Android.
   Build both now, but **launch on the App Store first**. Add Google Play submission
   later (cheap/easy once the RN code exists — mostly testing + a $25 one-time fee).

2. **Repo structure:** Monorepo, additive to the existing repo (no existing files move).
   ```
   yardage-app/
   ├── (existing web app files, unchanged: index.html, src/, api/, vercel.json, ...)
   ├── mobile/     ← new React Native (Expo) app
   └── shared/     ← yardage calculation engine + types, used by both web and mobile
   ```
   Rationale: the calculation logic should live in one place. Fix a formula once,
   both apps get the fix.

3. **Backend:** Supabase (Postgres + Auth).
   - Free tier: up to 50,000 users, 500MB DB — plenty to start, $0 cost.
   - Chosen over Firebase because the data is relational (clients → measurement
     sets → calculations) and Postgres + row-level security fits that naturally.
   - Need to create a project at supabase.com (not done yet).

4. **Subscriptions:** RevenueCat, wrapping Apple StoreKit + Google Play Billing in
   one SDK. Free up to $2.5k MRR, then 1% of revenue.

5. **Ads (free tier):** Google AdMob.

6. **Pricing model:** Free app, calculator usable by anyone (ad-supported, matches
   the current web app). Paid subscription unlocks client profiles: saved clients,
   measurement sets, and calculation history.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo (SDK 52) |
| Navigation | Expo Router (file-based) |
| Auth + DB | Supabase |
| Subscriptions | RevenueCat (`react-native-purchases`) |
| Ads | Google AdMob (`react-native-google-mobile-ads`) |
| State | Zustand |
| Styling | NativeWind (Tailwind for RN) |
| Language | TypeScript throughout |

## Planned directory layout

```
mobile/
├── app.json, package.json, tsconfig.json, babel.config.js, metro.config.js, tailwind.config.js
├── app/                          (Expo Router screens)
│   ├── _layout.tsx                root layout, auth gate
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── (app)/
│       ├── _layout.tsx            tab navigator: Calculator / Clients / Settings
│       ├── index.tsx              calculator (free, no login required)
│       ├── clients/
│       │   ├── index.tsx          client list (subscription-gated)
│       │   ├── new.tsx
│       │   └── [id].tsx           client detail: measurement sets + saved calcs
│       └── settings.tsx           account, subscription status, units
└── src/
    ├── lib/supabase.ts, lib/constants.ts
    ├── stores/ (auth, calculator, clients — Zustand)
    ├── components/ui/ (Button, Input, Card), components/PaywallGate.tsx
    └── hooks/ (useAuth, useSubscription)

shared/
├── types/index.ts                 Client, MeasurementSet, SavedCalculation, CalculatorOptions, etc.
└── calculations/                   ported 1:1 from index.html (see formulas below)
    ├── jacket.ts, trousers.ts, vest.ts, shirt.ts, lining.ts
    └── index.ts
```

## Database schema (Supabase / Postgres)

```sql
-- clients: one row per tailor's client
create table clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- measurement_sets: a client can have multiple (e.g. "2024 fitting", "slim profile")
create table measurement_sets (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  label text default 'Default',
  measure_mode text default 'body',     -- 'body' | 'garment'
  unit text default 'imperial',         -- 'imperial' | 'metric'
  chest numeric, stomach numeric, bicep numeric, shoulder numeric,
  sleeve_length numeric, back_length numeric, vest_length numeric,
  waist numeric, hip numeric, outseam numeric, inseam numeric,
  leg_open numeric, shirt_length numeric, neck numeric,
  thigh numeric, calf numeric, cuff numeric, rise numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- saved_calculations: a yardage result tied to a client + measurement set
create table saved_calculations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  measurement_set_id uuid references measurement_sets(id),
  garments text[],          -- e.g. ['jacket','trousers']
  fabric_width numeric,
  options jsonb,             -- style options snapshot
  results jsonb,             -- shell/lining/interfacing totals
  notes text,
  created_at timestamptz default now()
);

-- user_subscriptions: synced from RevenueCat via webhook
create table user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean default false,
  product_id text,
  expires_at timestamptz,
  updated_at timestamptz default now()
);

alter table clients enable row level security;
alter table measurement_sets enable row level security;
alter table saved_calculations enable row level security;
alter table user_subscriptions enable row level security;

create policy "own clients" on clients for all using (auth.uid() = user_id);
create policy "own clients' measurement sets" on measurement_sets for all
  using (client_id in (select id from clients where user_id = auth.uid()));
create policy "own clients' calculations" on saved_calculations for all
  using (client_id in (select id from clients where user_id = auth.uid()));
create policy "own subscription" on user_subscriptions for all
  using (auth.uid() = user_id);
```

## Yardage formulas (ported verbatim from `index.html`, lines ~1346-1452)

All formulas are calibrated for 60"-wide fabric at ~40" body chest / 42" hip, then
scaled by `widthFactor(w) = 60 / w` for the user's actual fabric width.

```js
function widthFactor(w) { return 60 / w; }

// Ease by fit style, body-measurement mode only (inches). Vest uses chest/2.
const FIT_EASE = {
  slim:    { chest: 2, waist: 0.75, seat: 1.5, bicep: 0.75, thigh: 1.5 },
  modern:  { chest: 3, waist: 1,    seat: 2,   bicep: 1,    thigh: 2   },
  classic: { chest: 4, waist: 1.25, seat: 2.5, bicep: 1.25, thigh: 2.5 }, // (presumed step beyond modern — verify in source)
};

function calcJacket(m, wf) {
  const body = measureMode === 'body';
  const fit = options.fit || 'modern';
  const effectiveChest = Math.max(m.chest || 40, m.stomach || 0);
  const finishedChest = effectiveChest + (body ? FIT_EASE[fit].chest : 0);

  let yards60 = ((m.backLength || 30) * 1.5 + (m.sleeveLength || 24) + 12) / 36;
  yards60 += Math.max(0, (finishedChest - 43) * 0.022);   // layout efficiency, baseline 43"
  if (options.pockets === 'patch') yards60 += 0.25;

  return +(yards60 * wf).toFixed(2);
}

function calcTrousers(m, wf) {
  const body = measureMode === 'body';
  const fit = options.fit || 'modern';
  const finishedHip = (m.hip || 42) + (body ? FIT_EASE[fit].seat : 0);

  const trsLength = m.outseam || ((m.inseam || 30) + 12);
  let yards60 = (trsLength + 10) / 36;
  yards60 += Math.max(0, (finishedHip - 42) * 0.015);     // layout efficiency, baseline 42"

  const cuffDepth = parseFloat(options.cuffs) || 0;
  if (cuffDepth > 0) yards60 += (cuffDepth * 4) / 36;
  yards60 += (parseFloat(options.waistbandWidth) - 1.5) * 0.06;

  return +(yards60 * wf).toFixed(2);
}

function calcVest(m, wf) {
  const body = measureMode === 'body';
  const fit = options.fit || 'modern';
  const effectiveChest = Math.max(m.chest || 40, m.stomach || 0);
  const finishedChest = effectiveChest + (body ? FIT_EASE[fit].chest / 2 : 0);

  let yards60 = (m.backLength * 0.7 + 4) / 36;
  yards60 += Math.max(0, (finishedChest - 43) * 0.01);
  if (options.vestBack === 'fabric') yards60 += 0.35;

  return +(yards60 * wf).toFixed(2);
}

function calcShirt(m, wf) {
  const body = measureMode === 'body';
  const fit = options.fit || 'modern';
  const finishedChest = (m.chest || 40) + (body ? FIT_EASE[fit].chest : 0);

  let yards60 = ((m.shirtLength || 30) + (m.sleeveLength || 24) + 16) / 36;
  yards60 += Math.max(0, (finishedChest - 43) * 0.015);

  return +(yards60 * wf).toFixed(2);
}

// Lining: jackets/coats/sportcoats get 85% of (adjusted) jacket-style base; slacks get 75% of outseam/36.
function calcLining(type, m) {
  if (['suit2', 'suit3', 'sportcoat'].includes(type)) {
    const body = measureMode === 'body';
    const fit = options.fit || 'modern';
    const finishedChest = (m.chest || 40) + (body ? FIT_EASE[fit].chest : 0);
    const base = ((m.backLength || 30) * 1.5 + (m.sleeveLength || 24) + 10) / 36;
    const chestAdj = Math.max(0, (finishedChest - 43) * 0.018);
    return +((base + chestAdj) * 0.85).toFixed(2);
  }
  if (type === 'slacks') return +((m.outseam / 36) * 0.75).toFixed(2);
  return 0;
}
```

There is also a 2-phase greedy first-fit-decreasing piece packer for the SVG cutting
layout (not yet transcribed here — see `index.html` for the full piece-geometry and
packing logic when porting the layout view).

## Open items / things to do on the local machine

- [ ] Create Supabase project, grab `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- [ ] Create RevenueCat account, link App Store Connect + Google Play Console apps
- [ ] Create AdMob account, get ad unit IDs
- [ ] `npx create-expo-app mobile` (or scaffold manually per layout above)
- [ ] Apple Developer account ($99/yr) for App Store submission
- [ ] Google Play Console account ($25 one-time) — for later Android launch
- [ ] Verify the `classic` fit ease values above against the actual source (marked
      "presumed" — re-check `index.html` around line 1361 which was cut off in the
      excerpt pulled here)

## Next session

Pick up by scaffolding `mobile/` and `shared/` per the layout above, starting with:
`shared/types`, `shared/calculations` (formulas above), then the Expo app shell,
Supabase client, and auth screens.
