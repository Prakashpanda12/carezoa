// ============================================================================
// Login Page — Admin OTP Login
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [devCode, setDevCode] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/otp/request', { phone });
      setDevCode(response.data.dev_code);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await login(phone, otp);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Carezoa Admin Console</CardTitle>
          <CardDescription>
            Sign in with your admin or support agent account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestOtp()}
                />
              </div>
              <Button onClick={handleRequestOtp} className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">OTP sent to {phone}</p>
              {devCode && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
                  Dev code: <strong>{devCode}</strong>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
              </div>
              <Button onClick={handleVerifyOtp} className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('phone')} className="w-full">
                Change Phone Number
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
