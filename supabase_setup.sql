-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
ON profiles FOR SELECT
USING ( true );

CREATE POLICY "Users can insert their own profile."
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- 2. Cached Movies Table
CREATE TABLE cached_movies (
    tmdb_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    poster_path TEXT,
    release_year TEXT
);

-- Enable RLS for cached_movies
ALTER TABLE cached_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cached movies are viewable by everyone."
ON cached_movies FOR SELECT
USING ( true );

CREATE POLICY "Authenticated users can insert cached movies."
ON cached_movies FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- 3. Watchlist Table
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tmdb_id INTEGER REFERENCES cached_movies(tmdb_id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tmdb_id)
);

-- Enable RLS for watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist."
ON watchlist FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert into their own watchlist."
ON watchlist FOR INSERT
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete from their own watchlist."
ON watchlist FOR DELETE
USING ( auth.uid() = user_id );

-- 4. Diary Entries Table
CREATE TABLE diary_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tmdb_id INTEGER REFERENCES cached_movies(tmdb_id) NOT NULL,
    watched_at DATE NOT NULL DEFAULT CURRENT_DATE,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    thought TEXT,
    is_rewatch BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for diary_entries
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diary entries."
ON diary_entries FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own diary entries."
ON diary_entries FOR INSERT
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own diary entries."
ON diary_entries FOR UPDATE
USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own diary entries."
ON diary_entries FOR DELETE
USING ( auth.uid() = user_id );

-- Set up trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id, 
    -- generate a default username based on their email
    split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 0, 5),
    split_part(new.email, '@', 1)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
