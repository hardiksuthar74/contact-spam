import { create } from "zustand";

type ModalType = "emailVerify" | "contactDetails" | "addContact";

interface ModalState {
  type: ModalType | null;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  data: ModalData;
  onClose: () => void;
}

export const useModal = create<ModalState>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));

interface ModalData {
  userdata?: UserData;
}

interface UserData {
  email?: string;
  phone_number?: string;
  name?: string;
  spam_likelihood?: number;
}
