import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MobileLoginFormProps {
  onSubmit: (mobile: string) => Promise<void>;
}

export const MobileLoginForm = ({ onSubmit }: MobileLoginFormProps) => {
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Indian mobile number validation
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      alert("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(mobile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
          Mobile Number
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">+91</span>
          </div>
          <Input
            id="mobile"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="pl-12"
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          Enter your 10-digit mobile number without country code
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || mobile.length !== 10}
      >
        {isLoading ? "Sending OTP..." : "Send OTP"}
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </form>
  );
};