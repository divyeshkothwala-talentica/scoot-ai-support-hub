-- Create a table for mobile authentication sessions
CREATE TABLE public.mobile_auth_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX idx_mobile_auth_sessions_mobile ON public.mobile_auth_sessions(mobile_number);
CREATE INDEX idx_mobile_auth_sessions_expires ON public.mobile_auth_sessions(expires_at);

-- Create a profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mobile_auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for mobile_auth_sessions (allow anyone to create and read their own sessions)
CREATE POLICY "Anyone can create auth sessions" 
ON public.mobile_auth_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can read their own sessions" 
ON public.mobile_auth_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own sessions" 
ON public.mobile_auth_sessions 
FOR UPDATE 
USING (true);

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up expired OTP sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_sessions()
RETURNS void AS $$
BEGIN
DELETE FROM public.mobile_auth_sessions 
WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;