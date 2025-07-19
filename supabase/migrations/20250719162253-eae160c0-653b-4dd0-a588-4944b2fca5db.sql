-- Create scooter_models table for specifications
CREATE TABLE public.scooter_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  model_code TEXT NOT NULL UNIQUE,
  max_speed INTEGER NOT NULL,
  range_km INTEGER NOT NULL,
  battery_capacity TEXT NOT NULL,
  motor_power TEXT NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  max_load_kg INTEGER NOT NULL,
  charging_time_hours DECIMAL(3,1) NOT NULL,
  wheel_size TEXT NOT NULL,
  brake_type TEXT NOT NULL,
  suspension TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model_specific_questions table
CREATE TABLE public.model_specific_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES public.scooter_models(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'general', -- general, specification, troubleshooting, compatibility
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faq_articles table
CREATE TABLE public.faq_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faq_ratings table for user feedback
CREATE TABLE public.faq_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faq_id UUID NOT NULL REFERENCES public.faq_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(faq_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.scooter_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_specific_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for scooter_models
CREATE POLICY "Anyone can view active scooter models" 
ON public.scooter_models 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage scooter models" 
ON public.scooter_models 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for model_specific_questions
CREATE POLICY "Anyone can view active model questions" 
ON public.model_specific_questions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage model questions" 
ON public.model_specific_questions 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for faq_articles
CREATE POLICY "Anyone can view published FAQ articles" 
ON public.faq_articles 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Authenticated users can manage FAQ articles" 
ON public.faq_articles 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for faq_ratings
CREATE POLICY "Users can view all FAQ ratings" 
ON public.faq_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own FAQ ratings" 
ON public.faq_ratings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_scooter_models_updated_at
BEFORE UPDATE ON public.scooter_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_model_specific_questions_updated_at
BEFORE UPDATE ON public.model_specific_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_articles_updated_at
BEFORE UPDATE ON public.faq_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample scooter models
INSERT INTO public.scooter_models (model_name, model_code, max_speed, range_km, battery_capacity, motor_power, weight_kg, max_load_kg, charging_time_hours, wheel_size, brake_type, suspension, price) VALUES
('Urban Pro X1', 'UPX1', 25, 40, '36V 10Ah', '350W', 15.5, 120, 4.5, '10 inch', 'Disc brake', 'Front suspension', 899.99),
('City Cruiser V2', 'CCV2', 20, 30, '36V 8Ah', '250W', 13.2, 100, 3.5, '8.5 inch', 'Electronic brake', 'None', 649.99),
('Speed Demon Pro', 'SDP', 35, 60, '48V 15Ah', '500W', 18.8, 150, 6.0, '10 inch', 'Hydraulic disc', 'Dual suspension', 1299.99),
('Eco Rider Lite', 'ERL', 15, 25, '24V 6Ah', '200W', 11.0, 80, 2.5, '6.5 inch', 'Foot brake', 'None', 399.99);

-- Insert model-specific questions
INSERT INTO public.model_specific_questions (model_id, category, question, answer, question_type, display_order) 
SELECT 
  sm.id,
  'specifications',
  'What are the specs of my ' || sm.model_name || '?',
  'Your ' || sm.model_name || ' specifications: Max Speed: ' || sm.max_speed || ' km/h, Range: ' || sm.range_km || ' km, Battery: ' || sm.battery_capacity || ', Motor: ' || sm.motor_power || ', Weight: ' || sm.weight_kg || ' kg, Max Load: ' || sm.max_load_kg || ' kg, Charging Time: ' || sm.charging_time_hours || ' hours, Wheels: ' || sm.wheel_size || ', Brakes: ' || sm.brake_type || ', Suspension: ' || sm.suspension,
  'specification',
  1
FROM public.scooter_models sm;

INSERT INTO public.model_specific_questions (model_id, category, question, answer, question_type, display_order)
SELECT 
  sm.id,
  'technical',
  'How do I charge my ' || sm.model_name || '?',
  'To charge your ' || sm.model_name || ': 1) Connect the charger to the charging port, 2) Plug into wall outlet, 3) Charging time is approximately ' || sm.charging_time_hours || ' hours for full charge, 4) The LED indicator will show red while charging and green when complete.',
  'troubleshooting',
  2
FROM public.scooter_models sm;

INSERT INTO public.model_specific_questions (model_id, category, question, answer, question_type, display_order)
SELECT 
  sm.id,
  'technical',
  'What accessories are compatible with ' || sm.model_name || '?',
  'Compatible accessories for your ' || sm.model_name || ' include: Phone holder, LED lights, rear view mirror, storage bag, and lock. All accessories are designed specifically for ' || sm.wheel_size || ' wheel models.',
  'compatibility',
  3
FROM public.scooter_models sm;

-- Insert sample FAQ articles
INSERT INTO public.faq_articles (title, content, category, tags) VALUES
('How to maintain your scooter battery', 'Proper battery maintenance is crucial for scooter longevity. Always charge after use, avoid complete discharge, store in cool dry place, and use only original chargers. Battery lifespan is typically 300-500 charge cycles.', 'maintenance', '{"battery", "maintenance", "charging"}'),
('Troubleshooting speed issues', 'If your scooter is not reaching maximum speed: 1) Check battery level, 2) Ensure proper tire pressure, 3) Check for brake drag, 4) Clean motor vents, 5) Contact support if issues persist.', 'troubleshooting', '{"speed", "performance", "troubleshooting"}'),
('Warranty and repair services', 'All scooters come with 12-month warranty covering manufacturing defects. Warranty includes free repairs and part replacement. For warranty claims, contact support with order number and issue description.', 'warranty', '{"warranty", "repair", "service"}'),
('Safety guidelines and regulations', 'Always wear a helmet, follow local traffic laws, check brakes before riding, avoid riding in rain, maintain safe speed, and use lights during night riding. Maximum rider weight varies by model.', 'safety', '{"safety", "regulations", "guidelines"}'),
('Scooter storage and transportation', 'For storage: clean thoroughly, charge battery to 50-80%, store in dry place, fold if possible. For transportation: use carrying case, remove battery if airline travel, secure properly in vehicles.', 'storage', '{"storage", "transportation", "travel"}');