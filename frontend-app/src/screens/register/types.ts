export interface RegisterFormState {
  displayName: string;
  birthDate: string; // yyyy-mm-dd, matches <input type="date">
  region: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  consent: boolean;
}

export const initialRegisterForm: RegisterFormState = {
  displayName: "",
  birthDate: "",
  region: "",
  phone: "",
  username: "",
  password: "",
  confirmPassword: "",
  consent: false,
};
