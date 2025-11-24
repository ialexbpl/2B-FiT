**Overview**
- Expo + TypeScript starter that runs in Expo Go. Minimal by design so hot reload works on iOS/Android without native setup. Each screen lives in its own folder.

**Folder Structure**
- `src/assets` — Images, icons, fonts, static files.
- `src/components` — Reusable UI components (buttons, inputs, cards).
- `src/config` — App configuration (e.g., `env.ts`).
- `src/context` — React Context providers (e.g., `ThemeContext`).
- `src/hooks` — Custom React hooks (`useRTL`, etc.).
- `src/lang` — i18n JSON dictionaries (`en.json`, `pl.json`).
- `src/models` — Data models and TypeScript interfaces.
- `src/navigation` — Navigation setup (add later if needed).
- `src/redux` — State management (optional; add later).
- `src/screens` — Screen components; one folder per screen.
- `src/styles` — Global styles, themes, tokens.
- `src/typings` — Global TypeScript types and module shims.
- `src/utils` — Utilities (simple i18n helper provided).

**Screen Pattern**
- `screens/ScreenName/ScreenName.tsx` — Main component
- `screens/ScreenName/styles.ts` — RTL-aware styles
- `screens/ScreenName/screenname.types.ts` — Screen-specific types

Example already included:
- `src/screens/Login/Login.tsx`
- `src/screens/Login/styles.ts`
- `src/screens/Login/login.types.ts`

**Getting Started**
- Prerequisites: Node 18+, npm or yarn, Android Studio (emulator) optional, Xcode only if building iOS locally.
- Install dependencies: `npm install`
- Start in Expo Go: `npm run start` then scan the QR with Expo Go app.
- Android emulator: `npm run android` (emulator running) or connect a device with USB debugging.
- iOS simulator (on a Mac): `npm run ios`.

**Expo Go vs Native Libraries**
- You can develop in Expo Go as long as you use packages supported by the Expo Go client (managed workflow).
- If you add a library that requires custom native code (not included in Expo Go), Expo Go can’t load it. Options then:
  - Prebuild to native projects: `npx expo prebuild` and run Android/iOS locally. After prebuild, you won’t use Expo Go for that app build.
  - Use a Development Build (requires building a custom client). EAS is the easiest route later, but intentionally left out for now.
- Practically: Yes, you can keep coding in Expo Go now. If you later add a native-only lib, test on Android by prebuilding or via a dev build; Expo Go will no longer run that build.

**Adding Navigation (Later)**
- Install: `npx expo install @react-navigation/native react-native-screens react-native-safe-area-context`
- Optional stacks/tabs: `npm i @react-navigation/native-stack @react-navigation/bottom-tabs`
- Wrap `App` with `NavigationContainer` and create stacks in `src/navigation`.

**Adding Redux (Later)**
- Install: `npm i @reduxjs/toolkit react-redux`
- Create `src/redux/store.ts` and slices, then wrap `App` with `<Provider>`.

**i18n Usage**
- Strings live in `src/lang/en.json` and `src/lang/pl.json`.
- Use `t('login.title')` from `src/utils/i18n.ts`. Switch locale with `setLocale('pl')`.

**Roadmap / Plan**
- 1) Build UI in `screens/*` folders.
- 2) Extract shared pieces into `components/*`.
- 3) Add navigation when multiple screens are ready.
- 4) Introduce Redux or Context for state if needed.
- 5) Add EAS or prebuild only when native modules are required.

## Friends & invitations (Supabase schema)
The profile screen now ships with a “Friends” panel that searches all users (partial matches, live updates), lets you send invites, respond to incoming requests, and surfaces notifications when someone accepts your invitation. Supabase needs a small helper table plus RLS policies:

```sql
create table if not exists public.friendships (
    id uuid primary key default uuid_generate_v4(),
    requester_id uuid references auth.users not null,
    addressee_id uuid references auth.users not null,
    status text not null default 'pending' check (status in ('pending','accepted','blocked')),
    created_at timestamptz not null default now(),
    responded_at timestamptz,
    requester_acknowledged boolean not null default false,
    addressee_acknowledged boolean not null default false,
    pair_key text generated always as (
        least(requester_id::text, addressee_id::text) || '|' || greatest(requester_id::text, addressee_id::text)
    ) stored,
    constraint friendships_no_self check (requester_id <> addressee_id),
    constraint friendships_pair_unique unique (pair_key)
);

alter table public.friendships enable row level security;

create policy "friendships select" on public.friendships for select
    using (auth.uid() in (requester_id, addressee_id));

create policy "friendships insert" on public.friendships for insert
    with check (auth.uid() = requester_id and requester_id <> addressee_id);

create policy "friendships update" on public.friendships for update
    using (auth.uid() in (requester_id, addressee_id));

create policy "friendships delete" on public.friendships for delete
    using (auth.uid() in (requester_id, addressee_id));
```

`requester_acknowledged` drives the “New confirmations” badge — after the invitee accepts (status ↦ `accepted`, `responded_at` stamped), the inviter sees the card until they tap **Got it** (row is updated with `requester_acknowledged = true`). Declining or canceling simply removes the row so users can send new invitations later.

**Polski (PL)**
- Szablon Expo + TypeScript działający w Expo Go. Minimalny, aby hot reload działał na iOS/Android bez konfiguracji natywnej. Każdy ekran ma własny folder.

Struktura katalogów:
- `src/assets` — Obrazy, ikony, czcionki, pliki statyczne.
- `src/components` — Wspólne komponenty UI.
- `src/config` — Konfiguracja aplikacji (np. `env.ts`).
- `src/context` — Providery React Context (np. `ThemeContext`).
- `src/hooks` — Własne hooki (np. `useRTL`).
- `src/lang` — Pliki tłumaczeń JSON (`en.json`, `pl.json`).
- `src/models` — Modele danych i interfejsy TS.
- `src/navigation` — Konfiguracja nawigacji (dodaj później).
- `src/redux` — Zarządzanie stanem (opcjonalnie; dodaj później).
- `src/screens` — Ekrany; jeden folder na ekran.
- `src/styles` — Style globalne, motywy.
- `src/typings` — Globalne typy TypeScript.
- `src/utils` — Narzędzia (prosty i18n w zestawie).

Wzorzec ekranu:
- `screens/Nazwa/Nazwa.tsx` — Komponent ekranu
- `screens/Nazwa/styles.ts` — Style z obsługą RTL
- `screens/Nazwa/nazwa.types.ts` — Typy dla ekranu

Uruchomienie:
- Wymagania: Node 18+, npm lub yarn, Android Studio (emulator) opcjonalnie, Xcode tylko do budowania iOS.
- Instalacja: `npm install`
- Start w Expo Go: `npm run start` i zeskanuj QR w aplikacji Expo Go.
- Emulator Android: `npm run android` (włączony emulator) lub urządzenie z USB debugging.
- iOS (na Macu): `npm run ios`.

Expo Go a biblioteki natywne:
- Działa, dopóki używasz bibliotek wspieranych przez Expo Go.
- Jeśli dodasz bibliotekę wymagającą własnego kodu natywnego, Expo Go jej nie załaduje. Wtedy:
  - Prebuild: `npx expo prebuild` i uruchamianie natywne Android/iOS (bez Expo Go dla tej wersji).
  - Development Build (własny klient). EAS pomoże później — na razie pominięte.

Dodanie nawigacji (później):
- `npx expo install @react-navigation/native react-native-screens react-native-safe-area-context`
- (opcjonalnie) `npm i @react-navigation/native-stack @react-navigation/bottom-tabs`
- Owiń `App` w `NavigationContainer` i utwórz stosy w `src/navigation`.

Dodanie Redux (później):
- `npm i @reduxjs/toolkit react-redux`
- Utwórz `src/redux/store.ts` i slice’y; owiń `App` w `<Provider>`.

Plan:
- 1) Buduj ekrany w `screens/*`.
- 2) Wyodrębnij wspólne elementy do `components/*`.
- 3) Dodaj nawigację przy wielu ekranach.
- 4) Dodaj Redux/Context wg potrzeb.
- 5) Dodaj EAS lub prebuild, gdy potrzebujesz natywnych bibliotek.

