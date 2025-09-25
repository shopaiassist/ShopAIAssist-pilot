import { useState } from 'react';
import { i18n } from '@/';
import { SafButton, SafDialog } from '@/core-components/react';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from 'usehooks-ts';

import { navigateToLogin, navigateToLogout } from '../../@util/login';
import { parseMessages } from '../../@util/parsers';
import useMemoizedContext from '../../hooks/mfe/useMemoizedContext';
import useIdleTimeout from '../../hooks/useIdleTimeout';
import useMFECommunication, { CustomEventData } from '../../hooks/useMFECommunication';
import useModalCommunication from '../../hooks/useModalCommunication';
import useModalInitialization from '../../hooks/useModalInitialization';
import useSecondaryNavState from '../../hooks/useSecondaryNavState';
import useToggle from '../../hooks/useToggle';
import feedbackStore from '../../store/feedbackStore';
import { ModalType } from '../../store/modalStore';
import GlobalFeedback from '../global-feedback/GlobalFeedback';
import MainHeader from '../header/MainHeader';
import PendoIntegration from '../sales/PendoIntegration';
import MainSideNav from '../sidenav/MainSideNav';
import SecondarySideNav from '../sidenav/SecondarySideNav';

// Breakpoints (max-width)
export const SCREEN_XS = '(max-width: 480px)';
export const SCREEN_SM = '(max-width: 640px)';
export const SCREEN_MD = '(max-width: 768px)';
export const SCREEN_LG = '(max-width: 1024px)';
export const SCREEN_XL = '(max-width: 1280px)';
export const SCREEN_XXL = '(max-width: 1440px)';

const useMfeMessage = () => useState<CustomEventData | undefined>(undefined);

interface IMessage {
  message: string;
  sender: string;
  sent_time: string;
}

const RootLayout = () => {
  useMFECommunication(undefined, (data) => {
    handleEvent(data);
  });
  useMFECommunication('chat_transcript', (data) => {
    handleChatTranscript(data);
  });
  useModalInitialization();

  const isMobile = useMediaQuery(SCREEN_XS);

  const [, setMfeMsg] = useMfeMessage();
  const { t } = i18n.useTranslation();

  const [sendEvent] = useMFECommunication('global_feedback');

  const [filteredMessages, setFilteredMessages] = useState<IMessage[]>([]);
  const [mainSideNavExpanded, toggleMainSideNav] = useToggle(false);
  const [secondaryNavState, setSecondaryNavState] = useSecondaryNavState();
  const { 
    isGlobalFeedbackOpen, setIsGlobalFeedbackOpen, 
    isSending, setIsSending,
    setIsSendingCompleted } = feedbackStore();
  const { handleClose, modalType, mediaQueryKey } = useModalCommunication();
  const context = useMemoizedContext();

  // Right Container should be hidden when side nav is expanded to
  // prevent users from tabbing into elements that are hidden from view
  const shouldHideRightContainer =
    modalType === ModalType.Compact && mediaQueryKey !== 'XL_1920' && mainSideNavExpanded;

  const [idleState, remainingTime, activate] = useIdleTimeout();
  const remainingMinutes = Math.floor(remainingTime / 60);
  const remainingSeconds = remainingTime % 60;
  const remainingTimeString =
    remainingMinutes > 1
      ? remainingMinutes
      : `${remainingMinutes}:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;
  const isMinimized = modalType === ModalType.Minimized;

  useMFECommunication('isChatting', (data: CustomEventData) => { 
    sessionStorage.setItem('isChatting', data.body.isChatting.toString());    
  });

  useMFECommunication('send_feedback_complete', (data: CustomEventData) => {
    if ((data.body.success || !data.body.success) && isSending) {   
      setIsSendingCompleted(true);
      
      setTimeout(() => {
        setIsGlobalFeedbackOpen(false); 
        setIsSendingCompleted(false);
        sessionStorage.removeItem('isChatting');
        setIsSending(false);
        handleClose();
      }, 2500);
    }
  });

  const handleEvent = (data: CustomEventData) => {
    if (data.message === 'mfe1.hello') {
      setMfeMsg(data.body);
    }
  };

  const handleChatTranscript = (data: CustomEventData): void => {
    setFilteredMessages(data.body.filteredMessages);
  };

  /** Click handler for 'continue session' button in the timeout warning modal */
  const onContinueSession = () => {
    activate();
  };

  /** Click handler for the logout button in the timeout warning modal */
  const onSignOut = () => {
    navigateToLogout();
  };

  /** Click handler for the sign back in button on the session expired modal */
  const onSignIn = () => {
    navigateToLogin();
  };  

  const closeGlobalFeedback = (): void => {
    setIsGlobalFeedbackOpen(false);
    sessionStorage.removeItem('isChatting');
    handleClose();    
  }

  const sendGlobalFeedback = (isLiked: boolean, comment?: string) => {
    sendEvent({ message: 'global_feedback', body: { isLiked, comment } }); 
    setIsSending(true);
  }

  const downloadTranscript = () => {
    const text: string | undefined = filteredMessages.map((msg: IMessage) => {
      const sent_datetime = new Date(msg.sent_time);
      let message: string = 
        `${msg.sender.toUpperCase()}: ${sent_datetime.toUTCString()} - ${parseMessages(msg.message)}\n`;
      message += '-'.repeat(100) + '\n';

      return message;
    }).join('\n');

    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "chat-history.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };
  

  // Prevent rendering anything until the `/api/user/me` call returned a response.
  if (!context) {
    return <></>;
  }

  return (
    <>
      <div
        className={modalType !== ModalType.Minimized ? 'olympus-root-container' : 'olympus-root-container-minimized'}
      >
        <MainHeader isMinimized={isMinimized} />
        <div className={modalType !== ModalType.Minimized ? 'olympus-main-container' : 'olympus-main-container-minimized'}>
          <MainSideNav
            expanded={mainSideNavExpanded}
            isMobile={isMobile}
            toggleExpanded={toggleMainSideNav}
            setSecondaryNavState={setSecondaryNavState}
          />
          {secondaryNavState.show && (
            <SecondarySideNav
              tree={secondaryNavState.tree}
              isMobile={isMobile}
              closeNav={() => setSecondaryNavState({ ...secondaryNavState, show: false })}
              toggleMainNav={toggleMainSideNav}
            />
          )}
          <div className={shouldHideRightContainer ? 'olympus-right-container-hidden' : 'olympus-right-container'}>
            <Outlet context={context} />
          </div>
          {context && <PendoIntegration context={context} />}
        </div>
        <SafDialog
          id="timeout-warning"
          className="olympus-timeout-modal"
          modal
          hidden={idleState !== 'warning'}
          isAlert="true"
          isHeader="true"
          isFooter="true"
          dialogTitle={t('TIMEOUT_WARNING_HEADER')}
          onCancel={onContinueSession}
          onClose={onContinueSession}
        >
          <p>{t('TIMEOUT_WARNING_BODY', { time: remainingTimeString })}</p>
          <div slot="footer" className="modal-buttons">
            <SafButton appearance="tertiary" onClick={onSignOut}>
              {t('SIGN_OUT')}
            </SafButton>
            <SafButton appearance="primary" onClick={onContinueSession}>
              {t('CONTINUE_SESSION')}
            </SafButton>
          </div>
        </SafDialog>
        <SafDialog
          id="session-expired"
          className="olympus-timeout-modal"
          modal
          hidden={idleState !== 'expired'}
          isAlert="true"
          isHeader="true"
          isFooter="true"
          dialogTitle={t('EXPIRED_SESSION_HEADER')}
          onCancel={onSignIn}
          onClose={onSignIn}
        >
          <p>{t('EXPIRED_SESSION_BODY')}</p>
          <div slot="footer" className="modal-buttons">
            <SafButton appearance="primary" onClick={onSignIn}>
              {t('SIGN_IN_CONTINUE')}
            </SafButton>
          </div>
        </SafDialog>
        {modalType === ModalType.Minimized &&  <span tabIndex={0}></span> /* This is needed to fix the focus trap in minimized mode */}
       
      </div>
      <GlobalFeedback 
        isOpen={isGlobalFeedbackOpen} 
        sendClose={closeGlobalFeedback} 
        sendFeedback={sendGlobalFeedback}
        sendTranscript={downloadTranscript} />
    </>
  );
};

export default RootLayout;
