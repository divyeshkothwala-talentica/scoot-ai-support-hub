-- Create scooter_orders table
CREATE TABLE public.scooter_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  scooter_model TEXT NOT NULL,
  scooter_color TEXT NOT NULL,
  order_status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  estimated_delivery DATE,
  delivery_address TEXT NOT NULL,
  order_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scooter_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own orders" 
ON public.scooter_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.scooter_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.scooter_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scooter_orders_updated_at
BEFORE UPDATE ON public.scooter_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample scooter orders
INSERT INTO public.scooter_orders (user_id, order_number, scooter_model, scooter_color, order_status, tracking_number, estimated_delivery, delivery_address, order_total) VALUES
('36cde51c-716a-4702-8b19-1371a0b4e13c', 'SCT-2024-001', 'Urban Pro X1', 'Electric Blue', 'shipped', 'TRK123456789', '2025-07-22', '123 Main St, New York, NY 10001', 899.99),
('36cde51c-716a-4702-8b19-1371a0b4e13c', 'SCT-2024-002', 'City Cruiser V2', 'Midnight Black', 'processing', NULL, '2025-07-25', '456 Oak Ave, Brooklyn, NY 11201', 649.99),
('36cde51c-716a-4702-8b19-1371a0b4e13c', 'SCT-2024-003', 'Speed Demon Pro', 'Fire Red', 'delivered', 'TRK987654321', '2025-07-19', '789 Pine Rd, Queens, NY 11355', 1299.99);

-- Add order-related questions to admin_questions
INSERT INTO public.admin_questions (category, question, answer, display_order) VALUES
('delivery', 'Where is my scooter order?', 'I can help you track your scooter order. Please provide your order number (starts with SCT-) and I''ll give you the latest delivery status and tracking information.', 1),
('delivery', 'When will my scooter arrive?', 'Let me check your delivery timeline. Please share your order number and I''ll provide you with the estimated delivery date and current shipping status.', 2),
('delivery', 'Can I change my delivery address?', 'Delivery address changes may be possible depending on your order status. Please provide your order number so I can check if modifications are still available.', 3),
('service', 'My scooter order is damaged', 'I''m sorry to hear about the damage. Please provide your order number and describe the issue. We''ll arrange for a replacement or repair as needed.', 4),
('service', 'I want to cancel my scooter order', 'I can help you with order cancellation. Please provide your order number and I''ll check the cancellation policy based on your order status.', 5);