import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { OrgType, SubscriptionPlan } from "@delaw/types";

import type { AccountTypeKey } from "../constants";

// Multi-step registration state. Persisted to sessionStorage so it survives
// navigation between steps and page reloads, and is cleared on completion.

export interface RegistrationState {
  // Step 1
  accountType: AccountTypeKey | null;
  // Step 2
  fullName: string;
  email: string;
  dialCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  barNumber: string;
  stateOfPractice: string;
  acceptedTerms: boolean;
  // Step 3
  organisationName: string;
  organisationType: OrgType;
  lawyerCount: string;
  practiceAreas: string[];
  jurisdiction: string;
  // Step 4
  plan: SubscriptionPlan;

  setField: <K extends keyof RegistrationData>(
    key: K,
    value: RegistrationData[K],
  ) => void;
  togglePracticeArea: (area: string) => void;
  reset: () => void;
}

type RegistrationData = Omit<
  RegistrationState,
  "setField" | "togglePracticeArea" | "reset"
>;

const initialData: RegistrationData = {
  accountType: null,
  fullName: "",
  email: "",
  dialCode: "+234",
  phone: "",
  password: "",
  confirmPassword: "",
  barNumber: "",
  stateOfPractice: "Lagos",
  acceptedTerms: false,
  organisationName: "",
  organisationType: "LAW_FIRM",
  lawyerCount: "2–5",
  practiceAreas: [],
  jurisdiction: "NG",
  plan: "PROFESSIONAL",
};

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      ...initialData,
      setField: (key, value) => set({ [key]: value } as Partial<RegistrationData>),
      togglePracticeArea: (area) =>
        set((state) => ({
          practiceAreas: state.practiceAreas.includes(area)
            ? state.practiceAreas.filter((a) => a !== area)
            : [...state.practiceAreas, area],
        })),
      reset: () => set({ ...initialData }),
    }),
    {
      name: "delaw.registration",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
