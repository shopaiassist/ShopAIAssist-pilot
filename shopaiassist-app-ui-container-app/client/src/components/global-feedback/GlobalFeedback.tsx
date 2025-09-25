import { useEffect, useRef, useState } from 'react';
import { i18n } from '@/';
import { SafDialogInstance, SafTextAreaInstance } from '@/core-components';
import { SafButton, SafDialog, SafIcon, SafProgressRing,SafTextarea } from '@/core-components/react';

import feedbackStore from '../../store/feedbackStore';

import './GlobalFeedback.scss';

interface FeedbackProps {
  isOpen: boolean | undefined;
  sendClose: () => void;
  sendFeedback: (isLiked: boolean, comment: string) => void;
  sendTranscript: (message: string) => void;
}

const GlobalFeedback = ({ isOpen, sendClose, sendFeedback, sendTranscript }: FeedbackProps): JSX.Element => {
  const { t } = i18n.useTranslation();  
  
  const [isLiked, setIsLiked] = useState<boolean | undefined>(undefined);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [commentValue, setCommentValue] = useState<string>(''); 
  const { isSending, isSendingCompleted } = feedbackStore();  

  const textAreaEl = useRef<SafTextAreaInstance>(null);
  const dialogRef = useRef<SafDialogInstance>(null);

  useEffect(() => {
    setIsLiked(undefined);
    setCommentValue('');
    setIsFirstLoad(true);  
  }, [isOpen]);

  const handleCancelClick = () => { 
    sendClose();
  };

  const submitFeedback = () => {
    sendFeedback(isLiked as boolean, commentValue);
  };

  const upDownClick = (upDown: string) => {
    setIsFirstLoad(false);
    setCommentValue('');
    setIsLiked(upDown === 'like');
  };

  
  const triggerTranscript = () => {
    sendTranscript('transcript');
  }

  return (    
    <SafDialog 
      ref={dialogRef}
      id="feedback-dialog" 
      hidden={!isOpen} 
      modal={true} 
      onClose={handleCancelClick}
      is-alert={false} 
      is-header={true} 
      is-footer={true} 
      className="feedback-prompt"
      no-focus-trap={true} 
      dialog-title={t('FEEDBACK_PROMPT.TITLE')}>
      <div>
        <div className="feedback-prompt__updown">
          <SafButton 
            appearance={isLiked && !isFirstLoad ? 'primary' : 'secondary'}
            aria-pressed={isLiked !== undefined && isLiked}
            aria-label={t('FEEDBACK_PROMPT.LIKE')}
            disabled={isSending}
            onClick={() => upDownClick('like')}>
            <SafIcon icon-name="thumbs-up" appearance="light" presentation></SafIcon>
          </SafButton>
          <SafButton 
            appearance={!isLiked && !isFirstLoad ? 'primary' : 'secondary'} 
            aria-pressed={isLiked !== undefined && !isLiked}
            aria-label={t('FEEDBACK_PROMPT.DISLIKE')}
            disabled={isSending}
            onClick={() => upDownClick('dislike')}>
            <SafIcon icon-name="thumbs-down" appearance="light" presentation></SafIcon>
          </SafButton>
        </div>
        { !isFirstLoad && <div className="feedback-prompt__comments">
          <SafTextarea 
            ref={textAreaEl}
            className="comment_textarea" 
            maxlength={500}
            disabled={isSending}
            onInput={(evt) => setCommentValue(evt.currentTarget.currentValue)}
            label={t('FEEDBACK_PROMPT.COMMENTS')} />
        </div> }
      </div>
      <div slot="footer" className="controls">
        <div className="button-controls">
          <SafButton className="download-transcript" appearance="tertiary" onClick={triggerTranscript}>
            <span>{t('FEEDBACK_PROMPT.DOWNLOAD_TRANSCRIPT')}</span>
            <SafIcon icon-name="download" appearance="light" presentation></SafIcon>
          </SafButton>
          { !isFirstLoad && <SafButton 
            appearance="primary"
            disabled={isSending}
            onClick={() => submitFeedback()}>
              {t('FEEDBACK_PROMPT.SEND')}
              { (isSending && !isSendingCompleted) && <SafProgressRing className="loading-icon" slot="start" indeterminate={true} progressSize="small" /> }
          </SafButton> }  
        </div> 
        <div className="sending-completed">
          { isSendingCompleted && <span>{t('FEEDBACK_PROMPT.THANK_YOU')}</span> }
        </div>     
      </div>
    </SafDialog>
  );
};

export default GlobalFeedback;