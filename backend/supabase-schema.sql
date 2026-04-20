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
    email text not null unique,
    phone text not null,
    date_of_birth date not null,
    positions text[] not null check (array_length(positions, 1) between 1 and 3),
    age_category text not null default 'U20' check (age_category in ('U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR')),
    profile_photo text,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
    access_pass text unique,
    registration_date timestamptz not null default now()
);

alter table public.players
    add column if not exists age_category text not null default 'U20';

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
