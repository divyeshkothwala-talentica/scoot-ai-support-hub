-- Create admin_questions table for managing domain-specific questions
CREATE TABLE public.admin_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('delivery', 'technical', 'service', 'billing')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.admin_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_questions (for now, allow authenticated users to read, can be restricted later)
CREATE POLICY "Anyone can view active questions" 
ON public.admin_questions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage questions" 
ON public.admin_questions 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_admin_questions_updated_at
BEFORE UPDATE ON public.admin_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default questions for each category
INSERT INTO public.admin_questions (category, question, answer, display_order) VALUES
-- Delivery questions
('delivery', 'How can I track my order?', 'You can track your order using the tracking number sent to your email. Visit our tracking page or use our mobile app for real-time updates on your delivery status.', 1),
('delivery', 'What''s my delivery status?', 'I can help you check your delivery status. Please provide your order number or tracking ID, and I''ll give you the latest updates on your shipment.', 2),
('delivery', 'Can I schedule my delivery?', 'Yes! You can schedule your delivery for a convenient time. Contact our delivery team at least 24 hours before the expected delivery date to arrange a specific time slot.', 3),
('delivery', 'How do I verify or change my delivery address?', 'You can verify or change your delivery address by logging into your account and updating the shipping information. For orders already shipped, contact customer service immediately.', 4),

-- Technical questions  
('technical', 'My scooter battery isn''t charging properly', 'Battery charging issues can be resolved by: 1) Checking the charger connection, 2) Ensuring the charging port is clean, 3) Trying a different outlet, 4) Checking for firmware updates. If issues persist, contact technical support.', 1),
('technical', 'The motor is making unusual noises', 'Unusual motor noises may indicate: loose components, debris in the motor housing, or mechanical wear. Please stop using the scooter and contact our technical team for a diagnostic check.', 2),
('technical', 'Brake system feels weak or unresponsive', 'Brake issues require immediate attention for safety. Check brake cable tension, brake pad wear, and brake fluid levels. Schedule a service appointment or visit our nearest service center.', 3),
('technical', 'I''m having tire problems', 'For tire issues: Check tire pressure (recommended PSI on tire sidewall), inspect for punctures or wear, ensure proper tire alignment. We offer tire replacement and repair services.', 4),
('technical', 'Software or firmware issues', 'For software/firmware problems: 1) Restart your scooter, 2) Check for app updates, 3) Reset network connections, 4) Contact support for firmware updates or troubleshooting.', 5),

-- Service questions
('service', 'What''s the maintenance schedule?', 'Regular maintenance keeps your scooter in optimal condition: Monthly checks (tire pressure, brakes), Every 3 months (battery health, lights), Every 6 months (professional service), Annual comprehensive inspection. We''ll send maintenance reminders and offer service packages.', 1),
('service', 'Where are your service centers located?', 'We have service centers in major cities nationwide. Use our service center locator on our website or app to find the nearest location, check operating hours, and book appointments.', 2),
('service', 'How do I claim warranty?', 'To claim warranty: 1) Check warranty coverage in your user manual, 2) Gather purchase receipt and product serial number, 3) Contact customer service or visit a service center, 4) Describe the issue for evaluation.', 3),
('service', 'Are spare parts available?', 'Yes, we maintain a comprehensive inventory of genuine spare parts. Parts can be ordered through our website, app, or service centers. We offer same-day service for common parts at our service locations.', 4),

-- Billing questions
('billing', 'What payment methods do you accept?', 'We accept: Credit/debit cards (Visa, MasterCard, American Express), PayPal, bank transfers, and installment plans. For corporate customers, we offer invoice billing and bulk payment options.', 1),
('billing', 'How do I get my invoice?', 'Invoices are automatically sent to your registered email after purchase. You can also download invoices from your account dashboard or request copies from customer service.', 2),
('billing', 'How does the refund process work?', 'Refund process: 1) Initiate return request within return period, 2) Product inspection and approval, 3) Refund processed to original payment method, 4) Processing time: 3-7 business days depending on payment method.', 3),
('billing', 'I have a payment dispute', 'For payment disputes: Contact our billing department with transaction details, order number, and dispute reason. We''ll investigate and resolve within 48 hours. You can also dispute charges directly with your bank if needed.', 4);