import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignupFlow } from '../screens/SignupFlow';
import { api } from '../api/client';
import { useAuth } from '../store/auth';

// Mock dependencies
jest.mock('../api/client');
jest.mock('../store/auth');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('SignupFlow - Issue Fixes Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as any).mockReturnValue({
      setSession: jest.fn(),
      setPatient: jest.fn(),
    });
  });

  describe('Issue #1: Progress Indicator', () => {
    it('should show progress indicator on non-welcome steps', () => {
      const { getByText } = render(<SignupFlow />);
      fireEvent.press(getByText('Get Started'));
      expect(getByText('Step 1 of 4')).toBeTruthy();
    });

    it('should update progress as user advances', async () => {
      const { getByText, getByPlaceholderText } = render(<SignupFlow />);
      
      // Step 1: Phone
      fireEvent.press(getByText('Get Started'));
      expect(getByText('Step 1 of 4')).toBeTruthy();
      
      // Step 2: OTP
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 4')).toBeTruthy();
      });
    });
  });

  describe('Issue #2: Misleading Resend Button', () => {
    it('should show "Use a different phone number" instead of "Resend"', async () => {
      const { getByPlaceholderText, getByText } = render(<SignupFlow />);
      fireEvent.press(getByText('Get Started'));
      
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      await waitFor(() => {
        expect(getByText('Use a different phone number')).toBeTruthy();
      });
    });
  });

  describe('Issue #3: Loading Indicator During Profile Fetch', () => {
    it('should show loading messages during OTP verification', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<SignupFlow />);
      fireEvent.press(getByText('Get Started'));
      
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      (api.otpVerify as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { access_token: 'token' };
      });
      
      const otpInput = getByPlaceholderText('123456');
      fireEvent.changeText(otpInput, '123456');
      fireEvent.press(getByText('Verify'));
      
      // Should show loading overlay
      await waitFor(() => {
        expect(queryByText('Verifying your code...')).toBeTruthy();
      });
      
      // Should show different messages as process advances
      await waitFor(() => {
        expect(queryByText('Setting up your account...')).toBeTruthy();
      });
    });
  });

  describe('Issue #4: Nested ScrollView in Terms', () => {
    it('should have nestedScrollEnabled on terms ScrollView', async () => {
      const { getByPlaceholderText, getByText, UNSAFE_getByType } = render(<SignupFlow />);
      
      // Navigate to terms step
      fireEvent.press(getByText('Get Started'));
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      (api.otpVerify as jest.Mock).mockResolvedValue({ access_token: 'token' });
      (api.getProfile as jest.Mock).mockResolvedValue({});
      const otpInput = getByPlaceholderText('123456');
      fireEvent.changeText(otpInput, '123456');
      fireEvent.press(getByText('Verify'));
      
      // Fill profile and continue to terms
      await waitFor(() => {
        const nameInput = getByPlaceholderText('John Doe');
        fireEvent.changeText(nameInput, 'John Doe');
        const dobInput = getByPlaceholderText('14/09/1991');
        fireEvent.changeText(dobInput, '15/09/1990');
        fireEvent.press(getByText('Male'));
        const cityInput = getByPlaceholderText('Bhubaneswar');
        fireEvent.changeText(cityInput, 'Cuttack');
        const addressInput = getByPlaceholderText('123 Main St');
        fireEvent.changeText(addressInput, '123 Main Street');
        fireEvent.press(getByText('Continue'));
      });
      
      // Check that nested ScrollView has nestedScrollEnabled
      await waitFor(() => {
        const ScrollViews = UNSAFE_getByType('ScrollView');
        const nestedScrollView = ScrollViews.findAll(
          (sv: any) => sv.props.nestedScrollEnabled === true
        );
        expect(nestedScrollView.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Issue #5: Auto-focus OTP Input', () => {
    it('should have autoFocus on OTP input', async () => {
      const { getByPlaceholderText, getByText } = render(<SignupFlow />);
      fireEvent.press(getByText('Get Started'));
      
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      await waitFor(() => {
        const otpInput = getByPlaceholderText('123456');
        expect(otpInput.props.autoFocus).toBe(true);
      });
    });
  });

  describe('Issue #6: Phone Form Clear on Back Navigation', () => {
    it('should clear phone form when going back from OTP to phone', async () => {
      const { getByPlaceholderText, getByText, getByLabelText } = render(<SignupFlow />);
      fireEvent.press(getByText('Get Started'));
      
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      // Go back to phone step
      fireEvent.press(getByLabelText('Go back to previous step'));
      
      // Phone input should be reset to "+91"
      await waitFor(() => {
        const resetPhoneInput = getByPlaceholderText('+91 98765 43210');
        expect(resetPhoneInput.props.value).toBe('+91');
      });
    });
  });

  describe('Issue #7: DOB Auto-formatting', () => {
    it('should auto-format date as DD/MM/YYYY', async () => {
      const { getByPlaceholderText, getByText } = render(<SignupFlow />);
      
      // Navigate to profile step
      fireEvent.press(getByText('Get Started'));
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      (api.otpVerify as jest.Mock).mockResolvedValue({ access_token: 'token' });
      (api.getProfile as jest.Mock).mockResolvedValue({});
      const otpInput = getByPlaceholderText('123456');
      fireEvent.changeText(otpInput, '123456');
      fireEvent.press(getByText('Verify'));
      
      // Test DOB auto-formatting
      await waitFor(() => {
        const dobInput = getByPlaceholderText('14/09/1991');
        fireEvent.changeText(dobInput, '15091990');
        expect(dobInput.props.value).toBe('15/09/1990');
      });
    });

    it('should limit DOB to 8 digits', async () => {
      const { getByPlaceholderText, getByText } = render(<SignupFlow />);
      
      // Navigate to profile step
      fireEvent.press(getByText('Get Started'));
      (api.otpRequest as jest.Mock).mockResolvedValue({ success: true });
      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+911234567890');
      fireEvent.press(getByText('Send OTP'));
      
      (api.otpVerify as jest.Mock).mockResolvedValue({ access_token: 'token' });
      (api.getProfile as jest.Mock).mockResolvedValue({});
      const otpInput = getByPlaceholderText('123456');
      fireEvent.changeText(otpInput, '123456');
      fireEvent.press(getByText('Verify'));
      
      await waitFor(() => {
        const dobInput = getByPlaceholderText('14/09/1991');
        fireEvent.changeText(dobInput, '150919901234'); // More than 8 digits
        expect(dobInput.props.value).toBe('15/09/1990'); // Should be limited
      });
    });
  });

  describe('Issue #8: Unused Variable Fix', () => {
    it('should not have unused patient variable in verifyOtp', () => {
      // This is a code review check - verify that the unused variable was removed
      const signupFlowCode = require('fs').readFileSync(
        require('path').join(__dirname, '../screens/SignupFlow.tsx'),
        'utf-8'
      );
      
      // Check that "let patient = null;" is not in the verifyOtp function
      const verifyOtpMatch = signupFlowCode.match(/const verifyOtp[\s\S]*?^\s*\};/m);
      if (verifyOtpMatch) {
        expect(verifyOtpMatch[0]).not.toContain('let patient = null;');
      }
    });
  });
});
