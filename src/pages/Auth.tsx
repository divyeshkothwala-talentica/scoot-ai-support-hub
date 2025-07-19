import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileLoginForm } from "@/components/auth/MobileLoginForm";
import { OTPVerificationForm } from "@/components/auth/OTPVerificationForm";

const Auth = () => {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [sessionId, setSessionId] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleMobileSubmit = async (mobile: string) => {
    try {
      // Generate dummy OTP (for demo purposes)
      const dummyOTP = "123456";
      
      // Clean up expired sessions first
      await supabase.rpc('cleanup_expired_otp_sessions');
      
      // Create a new OTP session
      const { data, error } = await supabase
        .from('mobile_auth_sessions')
        .insert({
          mobile_number: mobile,
          otp_code: dummyOTP
        })
        .select()
        .single();

      if (error) throw error;

      setMobileNumber(mobile);
      setSessionId(data.id);
      setStep("otp");
      
      toast({
        title: "OTP Sent!",
        description: `Demo OTP: ${dummyOTP} (Use this to verify)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOTPVerify = async (otp: string) => {
    try {
      // Verify OTP
      const { data: session, error: sessionError } = await supabase
        .from('mobile_auth_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('otp_code', otp)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        throw new Error("Invalid or expired OTP");
      }

      // Update session as verified
      await supabase
        .from('mobile_auth_sessions')
        .update({ is_verified: true })
        .eq('id', sessionId);

      // Create or sign in user with mobile number
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) throw authError;

      // Create or update profile with mobile number
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          mobile_number: mobileNumber
        });

      if (profileError) throw profileError;

      toast({
        title: "Success!",
        description: "Successfully logged in with mobile number",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBackToMobile = () => {
    setStep("mobile");
    setMobileNumber("");
    setSessionId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-electric-green-50 to-electric-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-electric-green-500 to-electric-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛴</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ScooterChat Support
            </h1>
            <p className="text-gray-600">
              {step === "mobile" 
                ? "Enter your mobile number to get started" 
                : "Enter the OTP sent to your mobile"
              }
            </p>
          </div>

          {step === "mobile" ? (
            <MobileLoginForm onSubmit={handleMobileSubmit} />
          ) : (
            <OTPVerificationForm 
              mobileNumber={mobileNumber}
              onSubmit={handleOTPVerify}
              onBack={handleBackToMobile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;