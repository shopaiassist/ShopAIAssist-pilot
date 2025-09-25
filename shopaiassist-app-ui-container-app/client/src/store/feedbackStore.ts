import { create } from 'zustand';

interface IFeedbackStore {  
  isGlobalFeedbackOpen: boolean;  
  setIsGlobalFeedbackOpen: (isOpen: boolean) => void;
}

interface IFeedbackSending {
  isSending: boolean;
  isSendingCompleted: boolean;
  setIsSending: (isSending: boolean) => void;
  setIsSendingCompleted: (isSendingCompleted: boolean) => void;
}

const feedbackStore = create<IFeedbackStore & IFeedbackSending>()(
  (set) => (
    {
      isGlobalFeedbackOpen: false,
      setIsGlobalFeedbackOpen: (isGlobalFeedbackOpen: boolean) => set({ isGlobalFeedbackOpen }),
      isSending: false,
      setIsSending: (isSending: boolean) => set({ isSending }),
      isSendingCompleted: false,
      setIsSendingCompleted: (isSendingCompleted: boolean) => set({ isSendingCompleted })
    }
  )
);

export default feedbackStore;
