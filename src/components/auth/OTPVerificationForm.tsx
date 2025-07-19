import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft } from "lucide-react";

interface OTPVerificationFormProps {
  mobileNumber: string;
  onSubmit: (otp: string) => Promise<void>;
  onBack: () => void;
}

export const OTPVerificationForm = ({ 
  mobileNumber, 
  onSubmit, 
  onBack 
}: OTPVerificationFormProps) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(otp);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <p className="text-sm text-gray-600">OTP sent to</p>
          <p className="font-medium text-gray-900">+91 {mobileNumber}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <label className="text-sm font-medium text-gray-700 block mb-4">
            Enter 6-digit OTP
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-1">Demo Mode:</p>
          <p className="text-sm text-blue-700">Use OTP: <strong>123456</strong></p>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? "Verifying..." : "Verify OTP"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          className="text-sm text-electric-blue-600 hover:text-electric-blue-700 transition-colors"
          onClick={() => {
            // In real implementation, this would resend OTP
            alert("OTP resent! (Demo: Use 123456)");
          }}
        >
          Didn't receive OTP? Resend
        </button>
      </div>
    </form>
  );
};