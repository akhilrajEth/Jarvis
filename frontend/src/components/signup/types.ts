export interface SignupPopupProps {
  open: boolean;
  onClose: () => void;
  onSignup?: (email: string, password: string) => void;
}
