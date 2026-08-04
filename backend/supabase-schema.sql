-- Run this in Supabase SQL Editor
-- It creates tables expected by the backend API.

create extension if not exists pgcrypto;

create table if not exists public.admins (
    id uuid primary key default gen_random_uuid(),
    username text not null unique,
    password text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.players (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text unique,
    phone text,
    date_of_birth date,
    positions text[] not null check (array_length(positions, 1) between 1 and 3),
    age_category text not null default 'U20' check (age_category in ('U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR')),
    profile_photo text,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
    access_pass text unique,
    registration_date timestamptz not null default now(),
    joining_year integer not null default date_part('year', now())::int,
    matches_played integer not null default 0 check (matches_played >= 0),
    goals integer not null default 0 check (goals >= 0),
    assists integer not null default 0 check (assists >= 0),
    in_stats boolean not null default false
);

alter table public.players
    add column if not exists age_category text not null default 'U20';

alter table public.players
    add column if not exists matches_played integer not null default 0;

alter table public.players
    add column if not exists goals integer not null default 0;

alter table public.players
    add column if not exists assists integer not null default 0;

alter table public.players
    add column if not exists in_stats boolean not null default false;

alter table public.players
    add column if not exists password text;

alter table public.players
    alter column phone drop not null;

alter table public.players
    alter column date_of_birth drop not null;

create table if not exists public.referees (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null unique,
    phone text not null,
    license_number text not null unique,
    experience_years integer not null default 0 check (experience_years >= 0),
    status text not null default 'active' check (status in ('active', 'inactive')),
    added_by uuid references public.admins(id) on delete set null,
    created_at timestamptz not null default now()
);
