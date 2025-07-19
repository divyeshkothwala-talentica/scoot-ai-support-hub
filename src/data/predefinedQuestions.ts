export interface PredefinedQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const PREDEFINED_QUESTIONS: PredefinedQuestion[] = [
  // Delivery
  {
    id: "delivery-1",
    category: "Delivery",
    question: "How can I track my order?",
    answer: "You can track your order by logging into your account and visiting the 'My Orders' section. You'll find real-time tracking information and expected delivery dates. You can also use your order number to track via our website or mobile app."
  },
  {
    id: "delivery-2",
    category: "Delivery",
    question: "What's my delivery status?",
    answer: "To check your delivery status, please provide your order number. Generally, orders are processed within 24 hours and delivered within 3-7 business days depending on your location. You'll receive SMS and email updates at each stage."
  },
  {
    id: "delivery-3",
    category: "Delivery",
    question: "Can I schedule my delivery?",
    answer: "Yes! You can schedule your delivery during checkout or by contacting our delivery team. We offer flexible time slots including weekends. Premium delivery options include same-day and express delivery for urgent orders."
  },
  {
    id: "delivery-4",
    category: "Delivery",
    question: "How do I verify or change my delivery address?",
    answer: "You can update your delivery address in your account settings under 'Addresses'. For orders already placed, address changes are possible up to 24 hours before shipping. Please contact support immediately if you need to change an address for a shipped order."
  },

  // Technical Issues
  {
    id: "technical-1",
    category: "Technical Issues",
    question: "My scooter battery isn't charging properly",
    answer: "For battery charging issues, please try these steps: 1) Check if the charger is properly connected 2) Ensure the charging port is clean and dry 3) Try a different power outlet 4) Let the battery cool down if it's hot. If issues persist, our technical team can assist with battery diagnostics or replacement under warranty."
  },
  {
    id: "technical-2",
    category: "Technical Issues",
    question: "The motor is making unusual noises",
    answer: "Unusual motor noises can indicate several issues. Please avoid riding until diagnosed. Common causes include: loose components, worn bearings, or debris. Schedule an immediate inspection at our service center. Our technicians will perform a comprehensive motor check and provide necessary repairs."
  },
  {
    id: "technical-3",
    category: "Technical Issues",
    question: "Brake system feels weak or unresponsive",
    answer: "Brake safety is critical. Please stop using the scooter immediately. This could be due to worn brake pads, low brake fluid, or cable issues. Visit our nearest service center for immediate brake inspection and repair. We offer emergency brake service for safety-critical issues."
  },
  {
    id: "technical-4",
    category: "Technical Issues",
    question: "I'm having tire problems",
    answer: "For tire issues like punctures, low pressure, or excessive wear: 1) Check tire pressure regularly 2) Inspect for visible damage 3) Avoid overloading the scooter. We provide tire repair, replacement, and maintenance services at all service centers with genuine parts."
  },
  {
    id: "technical-5",
    category: "Technical Issues",
    question: "Software or firmware issues",
    answer: "For software/firmware problems: 1) Try restarting your scooter 2) Check for app updates 3) Ensure Bluetooth connectivity. We provide over-the-air updates and can perform manual firmware updates at service centers. Contact our tech support for remote assistance."
  },

  // Service Support
  {
    id: "service-1",
    category: "Service Support",
    question: "What's the maintenance schedule?",
    answer: "Regular maintenance keeps your scooter in optimal condition: Monthly checks (tire pressure, brakes), Every 3 months (battery health, lights), Every 6 months (professional service), Annual comprehensive inspection. We'll send maintenance reminders and offer service packages."
  },
  {
    id: "service-2",
    category: "Service Support",
    question: "Where are your service centers located?",
    answer: "We have service centers in major cities nationwide. Use our 'Find Service Center' tool on the website or app to locate the nearest center. We also offer mobile service for basic maintenance and emergency repairs at your location."
  },
  {
    id: "service-3",
    category: "Service Support",
    question: "How do I claim warranty?",
    answer: "Warranty claims are easy: 1) Contact support with your order number 2) Describe the issue with photos/videos if possible 3) We'll arrange pickup/inspection 4) Approved claims receive free repair/replacement. Warranty covers manufacturing defects for 2 years from purchase date."
  },
  {
    id: "service-4",
    category: "Service Support",
    question: "Are spare parts available?",
    answer: "Yes, we maintain comprehensive spare parts inventory including batteries, tires, brakes, lights, and accessories. Parts are available at service centers or can be ordered online. We guarantee genuine parts compatibility and offer installation services."
  },

  // Billing
  {
    id: "billing-1",
    category: "Billing",
    question: "What payment methods do you accept?",
    answer: "We accept multiple payment methods: Credit/Debit cards (Visa, Mastercard, Amex), Digital wallets (PayPal, Apple Pay, Google Pay), Bank transfers, EMI options, and cryptocurrency for select products. All payments are secure and encrypted."
  },
  {
    id: "billing-2",
    category: "Billing",
    question: "How do I get my invoice?",
    answer: "Invoices are automatically generated and sent to your registered email after purchase. You can also download invoices from your account dashboard under 'Order History'. For custom invoices or business purchases, contact our billing team."
  },
  {
    id: "billing-3",
    category: "Billing",
    question: "How does the refund process work?",
    answer: "Refunds are processed within 7-14 business days to your original payment method. Conditions: Product must be in original condition, returned within 30 days, with original packaging. Some items may have specific return policies. Processing fee may apply for certain payment methods."
  },
  {
    id: "billing-4",
    category: "Billing",
    question: "I have a payment dispute",
    answer: "For payment disputes: 1) Contact our billing team with transaction details 2) Provide supporting documentation 3) We'll investigate within 48 hours 4) Resolution typically takes 5-7 business days. For urgent disputes, our priority support team is available 24/7."
  }
];

export const QUESTION_CATEGORIES = [
  "Delivery",
  "Technical Issues", 
  "Service Support",
  "Billing"
];