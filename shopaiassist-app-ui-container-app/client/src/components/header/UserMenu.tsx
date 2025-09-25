import { KeyboardEvent } from 'react';
import { i18n } from '@/';
import { SafDivider, SafIcon, SafMenu, SafMenuItem, SafSrOnly } from '@/core-components/react';

export interface UserMenuProps {
  closeMenu: () => void;
  closeAction: () => void;
  moveLeftAction: () => void;
  moveRightAction: () => void;
  showMoveLeft: boolean;
  showMoveRight: boolean;
}

/** The user menu component used by the MainHeader */
const UserMenu = ({
  closeMenu,
  closeAction,
  moveLeftAction,
  moveRightAction,
  showMoveLeft,
  showMoveRight,
}: UserMenuProps) => {
  const { t } = i18n.useTranslation();

  const onCloseClick = () => {
    closeAction();
    closeMenu();
  };
  const onCloseKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onCloseClick();
    }
    if(event.key === 'Tab') {
      closeMenu();
    }
  };

  const onMoveLeftClick = () => {
    moveLeftAction();
    closeMenu();
  };
  const onMoveLeftKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onMoveLeftClick();
    }
    if(event.key === 'Tab') {
      closeMenu();
    }
  };

  const onMoveRightClick = () => {
    moveRightAction();
    closeMenu();
  };
  const onMoveRightKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onMoveRightClick();
    }
    if(event.key === 'Tab') {
      closeMenu();
    }
  };

  return (
    <SafMenu style={{ width: '16.25rem', marginTop: '1rem' }} data-testid="user-menu">
      {showMoveLeft ? (
        <>
          <SafDivider role="presentation" />
          <SafMenuItem
            current-value=""
            density="compact"
            onClick={onMoveLeftClick}
            onKeyDown={onMoveLeftKeyDown}
            data-testid="chat-move-left-button"
          >
            <SafIcon slot="start" icon-name={'arrow-left-from-line'} aria-hidden="true" role="presentation"></SafIcon>{' '}
            {t('MOVE_LEFT')}
            <SafSrOnly> {t('MOVE_LEFT')} </SafSrOnly>
          </SafMenuItem>
        </>
      ) : (
        <></>
      )}
      {showMoveRight ? (
        <>
          <SafDivider role="presentation" />
          <SafMenuItem
            current-value=""
            density="compact"
            onClick={onMoveRightClick}
            onKeyDown={onMoveRightKeyDown}
            data-testid="chat-move-right-button"
          >
            <SafIcon slot="start" icon-name={'arrow-right-from-line'} aria-hidden="true" role="presentation"></SafIcon>{' '}
            {t('MOVE_RIGHT')}
            <SafSrOnly> {t('MOVE_RIGHT_SR')} </SafSrOnly>
          </SafMenuItem>
        </>
      ) : (
        <></>
      )}

      <SafDivider role="presentation" />
      <SafMenuItem
        current-value=""
        density="compact"
        onClick={() => onCloseClick()}
        onKeyDown={onCloseKeyDown}
        data-testid="chat-close-button"
      >
        <SafIcon slot="start" icon-name={'xmark-large'} aria-hidden="true" role="presentation"></SafIcon> {t('CLOSE')}
        <SafSrOnly> {t('CLOSE_SR')} </SafSrOnly>
      </SafMenuItem>
    </SafMenu>
  );
};

export default UserMenu;
