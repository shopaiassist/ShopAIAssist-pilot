/* eslint-disable @typescript-eslint/no-unused-vars */ // TODO: Remove this after MVP delivery
import { useEffect, useRef } from 'react';
import { ClickOutside, i18n } from '@/';
import {
  SafAnchorRegion,
  SafButton,
  SafIcon,
  SafProductHeader,
  SafProductHeaderItem,
  SafSrOnly,
} from '@/core-components/react';
import FocusTrap from 'focus-trap-react';

import useDragModal from '../../hooks/useDragModal';
import useMFECommunication from '../../hooks/useMFECommunication';
import useModalCommunication from '../../hooks/useModalCommunication';
import useToggle from '../../hooks/useToggle';
import feedbackStore from '../../store/feedbackStore';
import useModalStore, { ModalType } from '../../store/modalStore';
import UserMenu from './UserMenu';

interface MainHeaderProps {
  isMinimized: boolean;
}

/**
 * Main header component.
 * @component
 */
const MainHeader = ({ isMinimized }: MainHeaderProps) => {
  const [userMenuOpen, toggleUserMenu] = useToggle();
  const { t } = i18n.useTranslation();
  const {
    handleCompactState,
    handleMinimizedState,
    handleFullState,
    handleClose,
    modalType,
    moveMaxLeft,
    moveMaxRight,
  } = useModalCommunication();

  const { setIsGlobalFeedbackOpen } = feedbackStore();
  const modalPosition = useModalStore((state) => state.modalPosition);
  const referencedModalPosition = useRef(modalType);

  const mainHeaderClassNames = `olympus-main-header ${isMinimized ? 'olympus-main-header-minimized' : ''}`;
  const [sendEvent] = useMFECommunication('modal-type');

  useDragModal();

  // update the referencedModalPosition when modalPosition changes
  useEffect(() => {
    referencedModalPosition.current = modalPosition;
  }, [modalPosition]);
  /**
   * Handles the user clicking the close command in the UserMenu component.
   * If the user has interacted with the AI chat, the global feedback component will open before closing.
   * If the user has not interacted with the AI chat, the global feedback will not open and the chat experience
   * will close.
   */
  const closeCommand = (): void => {
    const isChatting = sessionStorage.getItem('isChatting') === 'true';

    if (isChatting && modalType !== ModalType.Minimized) {
      setIsGlobalFeedbackOpen(true);
    } else {
      setIsGlobalFeedbackOpen(false);
      handleClose();
    }

    sessionStorage.removeItem('isChatting');
  };

  const focusOnElement = (id: string) => {
    setTimeout(() => {
      const btn = document.getElementById(id);
      if (btn) {
        btn?.focus();
        sendEvent({ message: 'modal-type', body: modalType });
      }
    }, 0);
  };

  return (
    <SafProductHeader
      id="saf-product-header"
      draggable={true}
      global-aria-label="Global"
      className={mainHeaderClassNames}
    >
      <div slot="logo">
        <h2 className="logo-header">
          <a href="/" aria-label="ShopAIAssist - Home">
            {/* <SafLogo appearance="full-color" product-name={t('APP_NAME')} /> */}
            <svg aria-label="ShopAIAssist" width="150" height="22" viewBox="0 0 150 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16.7734 4.85938L19 4L19.8203 1.8125C19.8594 1.61719 20.0547 1.5 20.25 1.5C20.4062 1.5 20.6016 1.61719 20.6406 1.8125L21.5 4L23.6875 4.85938C23.8828 4.89844 24 5.09375 24 5.25C24 5.44531 23.8828 5.64062 23.6875 5.67969L21.5 6.5L20.6406 8.72656C20.6016 8.88281 20.4062 9 20.25 9C20.0547 9 19.8594 8.88281 19.8203 8.72656L19 6.5L16.7734 5.67969C16.6172 5.64062 16.5 5.44531 16.5 5.25C16.5 5.09375 16.6172 4.89844 16.7734 4.85938ZM12.0078 4.39062L14.0391 8.84375L18.4922 10.875C18.7266 10.9922 18.8828 11.2266 18.8828 11.4609C18.8828 11.6953 18.7266 11.9297 18.4922 12.0078L14.0391 14.0781L12.0078 18.5312C11.8906 18.7656 11.6562 18.9219 11.4219 18.9219C11.1875 18.9219 10.9531 18.7656 10.875 18.5312L8.80469 14.0781L4.35156 12.0469C4.11719 11.9297 4 11.6953 4 11.4609C4 11.2266 4.11719 10.9922 4.35156 10.875L8.80469 8.84375L10.875 4.39062C10.9531 4.15625 11.1875 4 11.4219 4C11.6562 4 11.8906 4.15625 12.0078 4.39062ZM19 16.5L19.8203 14.3125C19.8594 14.1172 20.0547 14 20.25 14C20.4062 14 20.6016 14.1172 20.6406 14.3125L21.5 16.5L23.6875 17.3594C23.8828 17.3984 24 17.5938 24 17.75C24 17.9453 23.8828 18.1406 23.6875 18.1797L21.5 19L20.6406 21.2266C20.6016 21.3828 20.4062 21.5 20.25 21.5C20.0547 21.5 19.8594 21.3828 19.8203 21.2266L19 19L16.7734 18.1797C16.6172 18.1406 16.5 17.9453 16.5 17.75C16.5 17.5938 16.6172 17.3984 16.7734 17.3594L19 16.5Z"
                fill="#CA4615"
              />
              <path
                d="M32.7 11.34C32.7 10.2733 32.8533 9.31333 33.16 8.46C33.48 7.60667 33.9267 6.88667 34.5 6.3C35.0867 5.7 35.7867 5.24 36.6 4.92C37.4133 4.6 38.32 4.44 39.32 4.44C40.16 4.44 40.9 4.52 41.54 4.68C42.1933 4.82667 42.72 4.99333 43.12 5.18L42.74 7.16C42.3267 7 41.86 6.86667 41.34 6.76C40.82 6.65333 40.3267 6.6 39.86 6.6C38.3533 6.6 37.2 7 36.4 7.8C35.6 8.58667 35.2 9.76667 35.2 11.34C35.2 12.9133 35.6 14.1 36.4 14.9C37.2 15.6867 38.3533 16.08 39.86 16.08C40.3267 16.08 40.82 16.0267 41.34 15.92C41.86 15.8133 42.3267 15.68 42.74 15.52L43.12 17.5C42.72 17.6867 42.1933 17.8533 41.54 18C40.9 18.16 40.16 18.24 39.32 18.24C38.32 18.24 37.4133 18.08 36.6 17.76C35.7867 17.44 35.0867 16.9867 34.5 16.4C33.9267 15.8 33.48 15.0733 33.16 14.22C32.8533 13.3667 32.7 12.4067 32.7 11.34ZM53.4811 13.16C53.4811 13.8933 53.3811 14.5667 53.1811 15.18C52.9944 15.7933 52.7078 16.3267 52.3211 16.78C51.9344 17.22 51.4544 17.5667 50.8811 17.82C50.3078 18.0733 49.6411 18.2 48.8811 18.2C48.1211 18.2 47.4478 18.0733 46.8611 17.82C46.2878 17.5667 45.8078 17.22 45.4211 16.78C45.0344 16.3267 44.7411 15.7933 44.5411 15.18C44.3544 14.5667 44.2611 13.8933 44.2611 13.16C44.2611 12.4267 44.3544 11.7533 44.5411 11.14C44.7411 10.5267 45.0344 10 45.4211 9.56C45.8211 9.10667 46.3078 8.75333 46.8811 8.5C47.4544 8.24667 48.1211 8.12 48.8811 8.12C49.6411 8.12 50.3078 8.24667 50.8811 8.5C51.4544 8.75333 51.9344 9.10667 52.3211 9.56C52.7078 10 52.9944 10.5267 53.1811 11.14C53.3811 11.7533 53.4811 12.4267 53.4811 13.16ZM51.0411 13.16C51.0411 12.16 50.8678 11.3933 50.5211 10.86C50.1878 10.3267 49.6411 10.06 48.8811 10.06C48.1211 10.06 47.5678 10.3267 47.2211 10.86C46.8744 11.3933 46.7011 12.16 46.7011 13.16C46.7011 14.16 46.8744 14.9267 47.2211 15.46C47.5678 15.9933 48.1211 16.26 48.8811 16.26C49.6411 16.26 50.1878 15.9933 50.5211 15.46C50.8678 14.9267 51.0411 14.16 51.0411 13.16ZM54.8289 11.34C54.8289 10.2733 54.9822 9.31333 55.2889 8.46C55.6089 7.60667 56.0556 6.88667 56.6289 6.3C57.2156 5.7 57.9156 5.24 58.7289 4.92C59.5422 4.6 60.4489 4.44 61.4489 4.44C62.2889 4.44 63.0289 4.52 63.6689 4.68C64.3222 4.82667 64.8489 4.99333 65.2489 5.18L64.8689 7.16C64.4556 7 63.9889 6.86667 63.4689 6.76C62.9489 6.65333 62.4556 6.6 61.9889 6.6C60.4822 6.6 59.3289 7 58.5289 7.8C57.7289 8.58667 57.3289 9.76667 57.3289 11.34C57.3289 12.9133 57.7289 14.1 58.5289 14.9C59.3289 15.6867 60.4822 16.08 61.9889 16.08C62.4556 16.08 62.9489 16.0267 63.4689 15.92C63.9889 15.8133 64.4556 15.68 64.8689 15.52L65.2489 17.5C64.8489 17.6867 64.3222 17.8533 63.6689 18C63.0289 18.16 62.2889 18.24 61.4489 18.24C60.4489 18.24 59.5422 18.08 58.7289 17.76C57.9156 17.44 57.2156 16.9867 56.6289 16.4C56.0556 15.8 55.6089 15.0733 55.2889 14.22C54.9822 13.3667 54.8289 12.4067 54.8289 11.34ZM75.61 13.16C75.61 13.8933 75.51 14.5667 75.31 15.18C75.1233 15.7933 74.8367 16.3267 74.45 16.78C74.0633 17.22 73.5833 17.5667 73.01 17.82C72.4367 18.0733 71.77 18.2 71.01 18.2C70.25 18.2 69.5767 18.0733 68.99 17.82C68.4167 17.5667 67.9367 17.22 67.55 16.78C67.1633 16.3267 66.87 15.7933 66.67 15.18C66.4833 14.5667 66.39 13.8933 66.39 13.16C66.39 12.4267 66.4833 11.7533 66.67 11.14C66.87 10.5267 67.1633 10 67.55 9.56C67.95 9.10667 68.4367 8.75333 69.01 8.5C69.5833 8.24667 70.25 8.12 71.01 8.12C71.77 8.12 72.4367 8.24667 73.01 8.5C73.5833 8.75333 74.0633 9.10667 74.45 9.56C74.8367 10 75.1233 10.5267 75.31 11.14C75.51 11.7533 75.61 12.4267 75.61 13.16ZM73.17 13.16C73.17 12.16 72.9967 11.3933 72.65 10.86C72.3167 10.3267 71.77 10.06 71.01 10.06C70.25 10.06 69.6967 10.3267 69.35 10.86C69.0033 11.3933 68.83 12.16 68.83 13.16C68.83 14.16 69.0033 14.9267 69.35 15.46C69.6967 15.9933 70.25 16.26 71.01 16.26C71.77 16.26 72.3167 15.9933 72.65 15.46C72.9967 14.9267 73.17 14.16 73.17 13.16ZM79.8978 8.32V14.5C79.8978 15.0067 80.0178 15.4 80.2578 15.68C80.5111 15.96 80.8911 16.1 81.3978 16.1C82.0778 16.1 82.5911 15.88 82.9378 15.44C83.2845 15 83.4578 14.38 83.4578 13.58V8.32H85.8978V18H83.5178V16.32C83.2911 16.8133 82.9311 17.2533 82.4378 17.64C81.9445 18.0133 81.2978 18.2 80.4978 18.2C79.4178 18.2 78.6378 17.9133 78.1578 17.34C77.6911 16.7533 77.4578 15.94 77.4578 14.9V8.32H79.8978ZM94.5758 18V11.82C94.5758 11.3133 94.4491 10.92 94.1958 10.64C93.9424 10.36 93.5558 10.22 93.0358 10.22C92.3558 10.22 91.8291 10.44 91.4558 10.88C91.0958 11.3067 90.9158 11.92 90.9158 12.72V18H88.4758V8.32H90.8358V10C90.9558 9.74667 91.1024 9.50667 91.2758 9.28C91.4624 9.05333 91.6824 8.85333 91.9358 8.68C92.1891 8.50667 92.4758 8.37333 92.7958 8.28C93.1291 8.17333 93.5024 8.12 93.9158 8.12C95.0358 8.12 95.8291 8.40667 96.2958 8.98C96.7758 9.55333 97.0158 10.3667 97.0158 11.42V18H94.5758ZM106.391 14.98C106.391 15.9933 106.051 16.7867 105.371 17.36C104.705 17.92 103.765 18.2 102.551 18.2C101.965 18.2 101.351 18.1333 100.711 18C100.071 17.8667 99.4714 17.6867 98.9114 17.46L99.4314 15.7C99.9381 15.9 100.451 16.0667 100.971 16.2C101.491 16.32 102.005 16.38 102.511 16.38C103.498 16.38 103.991 16.0467 103.991 15.38C103.991 15.0867 103.878 14.8667 103.651 14.72C103.425 14.56 103.031 14.4 102.471 14.24C101.765 14.04 101.178 13.8333 100.711 13.62C100.245 13.4067 99.8714 13.18 99.5914 12.94C99.3247 12.6867 99.1314 12.4067 99.0114 12.1C98.9047 11.7933 98.8514 11.44 98.8514 11.04C98.8514 10.04 99.1781 9.30667 99.8314 8.84C100.498 8.36 101.431 8.12 102.631 8.12C103.338 8.12 103.958 8.18 104.491 8.3C105.038 8.40667 105.531 8.56667 105.971 8.78L105.531 10.54C105.145 10.3667 104.705 10.22 104.211 10.1C103.731 9.98 103.231 9.92 102.711 9.92C102.231 9.92 101.865 9.98 101.611 10.1C101.371 10.22 101.251 10.4467 101.251 10.78C101.251 10.9533 101.285 11.1 101.351 11.22C101.431 11.3267 101.551 11.4267 101.711 11.52C101.871 11.6133 102.078 11.7 102.331 11.78C102.585 11.86 102.898 11.9533 103.271 12.06C103.725 12.1933 104.145 12.34 104.531 12.5C104.918 12.66 105.245 12.8533 105.511 13.08C105.791 13.2933 106.005 13.5533 106.151 13.86C106.311 14.1667 106.391 14.54 106.391 14.98ZM110.081 14.04C110.148 14.8 110.401 15.38 110.841 15.78C111.281 16.18 111.954 16.38 112.861 16.38C113.408 16.38 113.921 16.32 114.401 16.2C114.894 16.08 115.361 15.92 115.801 15.72L116.221 17.38C115.714 17.6333 115.141 17.8333 114.501 17.98C113.874 18.1267 113.201 18.2 112.481 18.2C111.641 18.2 110.914 18.0867 110.301 17.86C109.688 17.62 109.181 17.28 108.781 16.84C108.381 16.4 108.081 15.8733 107.881 15.26C107.694 14.6333 107.601 13.9333 107.601 13.16C107.601 12.4533 107.688 11.7933 107.861 11.18C108.048 10.5667 108.328 10.0333 108.701 9.58C109.088 9.12667 109.574 8.77333 110.161 8.52C110.748 8.25333 111.441 8.12 112.241 8.12C112.961 8.12 113.574 8.24 114.081 8.48C114.588 8.70667 115.008 9.02667 115.341 9.44C115.674 9.85333 115.914 10.3467 116.061 10.92C116.221 11.4933 116.301 12.1267 116.301 12.82V14.04H110.081ZM112.201 9.8C111.521 9.8 111.014 10.0133 110.681 10.44C110.348 10.8533 110.141 11.48 110.061 12.32H114.001V12.06C114.001 11.38 113.861 10.8333 113.581 10.42C113.314 10.0067 112.854 9.8 112.201 9.8ZM122.182 17.94C122.009 18.0067 121.775 18.06 121.482 18.1C121.202 18.1533 120.915 18.18 120.622 18.18C119.715 18.18 119.082 17.94 118.722 17.46C118.362 16.9667 118.182 16.2933 118.182 15.44V4.68H120.622V15.42C120.622 15.6867 120.675 15.8867 120.782 16.02C120.902 16.1533 121.115 16.22 121.422 16.22C121.662 16.22 121.895 16.1867 122.122 16.12L122.182 17.94Z"
                fill="#232425"
              />
            </svg>
          </a>
        </h2>
        {/* )} */}
      </div>
      {modalType !== ModalType.Minimized ? (
        <div slot="global" className="header-menu">
          <SafProductHeaderItem>
            <SafButton
              id="compact-minimize-button"
              data-testid="Minimize-chat-top-button"
              appearance="tertiary"
              icon-only=""
              current-value=""
              density="compact"
              onClick={() => {
                handleMinimizedState();
                focusOnElement('compact-minimize-button');
              }}
            >
              <SafIcon icon-name={'arrow-down-from-line'} aria-hidden="true" role="presentation"></SafIcon>
              <SafSrOnly> t('MINIMIZE') </SafSrOnly>
            </SafButton>
          </SafProductHeaderItem>
          <SafProductHeaderItem>
            <SafButton
              id="full-compact-button"
              data-testid="Maximize-chat-top-button"
              appearance="tertiary"
              tabIndex={0}
              icon-only=""
              current-value=""
              density="compact"
              onClick={() => {
                modalType !== ModalType.Full ? handleFullState() : handleCompactState();
                focusOnElement('full-compact-button');
              }}
            >
              <SafIcon
                icon-name={
                  modalType === ModalType.Full
                    ? 'arrow-down-left-and-arrow-up-right-to-center'
                    : 'arrow-up-right-and-arrow-down-left-from-center'
                }
                aria-hidden="true"
                role="presentation"
              ></SafIcon>
              <SafSrOnly> {modalType === ModalType.Compact ? t('MAXIMIZE') : t('DEFAULT')} </SafSrOnly>
            </SafButton>
          </SafProductHeaderItem>
          <ClickOutside action={() => toggleUserMenu(false)}>
            <SafProductHeaderItem>
              <SafButton
                tabIndex={0}
                id="header-menu-btn"
                appearance="tertiary"
                icon-only=""
                current-value=""
                density="compact"
                onClick={() => toggleUserMenu()}
              >
                <SafIcon icon-name="ellipsis-vertical" aria-hidden="true" appearance="solid"></SafIcon>
                <SafSrOnly> t('HEADER_MENU') </SafSrOnly>
              </SafButton>
            </SafProductHeaderItem>
            <SafAnchorRegion anchor="header-menu-btn" horizontalInset horizontalPositioningMode="dynamic">
              {userMenuOpen && (
                <UserMenu
                  closeMenu={() => toggleUserMenu(false)}
                  closeAction={closeCommand}
                  moveLeftAction={moveMaxLeft}
                  moveRightAction={moveMaxRight}
                  showMoveLeft={modalPosition !== 'left' && modalPosition !== 'full'}
                  showMoveRight={modalPosition !== 'right' && modalPosition !== 'full'}
                />
              )}
            </SafAnchorRegion>
          </ClickOutside>
        </div>
      ) : (
        <FocusTrap>
          <div slot="global">
            <SafProductHeaderItem>
              <SafButton
                id="compact-minimize-button"
                data-testid="Minimize-chat-top-button"
                tabIndex={1}
                appearance="tertiary"
                icon-only=""
                current-value=""
                density="compact"
                onClick={() => {
                  handleCompactState();
                  focusOnElement('compact-minimize-button');
                }}
              >
                <SafIcon icon-name={'arrow-up-from-line'} aria-hidden="true" role="presentation"></SafIcon>
                <SafSrOnly> t('MINIMIZE') </SafSrOnly>
              </SafButton>
            </SafProductHeaderItem>
            <SafProductHeaderItem>
              <SafButton
                id="full-compact-button"
                data-testid="Maximize-chat-top-button"
                appearance="tertiary"
                tabIndex={2}
                icon-only=""
                current-value=""
                density="compact"
                onClick={() => {
                  handleFullState();
                  focusOnElement('full-compact-button');
                }}
              >
                <SafIcon
                  icon-name={'arrow-up-right-and-arrow-down-left-from-center'}
                  aria-hidden="true"
                  role="presentation"
                ></SafIcon>
                <SafSrOnly> {t('DEFAULT')} </SafSrOnly>
              </SafButton>
            </SafProductHeaderItem>

            <ClickOutside action={() => toggleUserMenu(false)}>
              <SafProductHeaderItem>
                <SafButton
                  tabIndex={3}
                  id="header-menu-btn"
                  appearance="tertiary"
                  icon-only=""
                  current-value=""
                  density="compact"
                  onClick={() => toggleUserMenu()}
                >
                  <SafIcon icon-name="ellipsis-vertical" aria-hidden="true" appearance="solid"></SafIcon>
                  <SafSrOnly> t('HEADER_MENU') </SafSrOnly>
                </SafButton>
              </SafProductHeaderItem>
              <SafAnchorRegion
                anchor="header-menu-btn"
                horizontalInset
                horizontalPositioningMode="dynamic"
                verticalPositioningMode="locktodefault"
                verticalDefaultPosition="top"
              >
                {userMenuOpen && (
                  <UserMenu
                    closeMenu={() => toggleUserMenu(false)}
                    closeAction={closeCommand}
                    moveLeftAction={moveMaxLeft}
                    moveRightAction={moveMaxRight}
                    showMoveLeft={modalPosition !== 'left' && modalPosition !== 'full'}
                    showMoveRight={modalPosition !== 'right' && modalPosition !== 'full'}
                  />
                )}
              </SafAnchorRegion>
            </ClickOutside>
          </div>
        </FocusTrap>
      )}
    </SafProductHeader>
  );
};

export default MainHeader;
