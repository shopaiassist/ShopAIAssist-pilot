import { useState, useEffect } from 'react';
import { useChatSidebarStore } from '../store/useChatSidebarStore';

/**
 * Custom hook for animating text with a typewriter effect.
 *
 * This hook takes a string and a delay and returns the text as it would be typed out, one character at a time.
 * It resets the typing effect if the text or `isNameUpdate` state changes.
 *
 * @param {string} text - The text to be animated.
 * @param {number} delay - The delay in milliseconds between each character.
 * @returns {[string]} - Returns the current text being displayed.
 *
 * @example
 * const [currentText] = useTypewriterText("Hello, world!", 100);
 */
const useTypewriterText = (text: string, delay: number) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNameUpdate, setIsNameUpdate] = useChatSidebarStore((state) => [state.isNameUpdate, state.setIsNameUpdate]);

  useEffect(() => {
    currentText != text && setCurrentText('');
  }, [isNameUpdate, text]);

  useEffect(() => {
    if (currentIndex < text.length && isNameUpdate) {
      if (currentText !== text) {
        const timeout = setTimeout(() => {
          setCurrentText((prevText) => prevText + text[currentIndex]);
          setCurrentIndex((prevIndex) => prevIndex + 1);
        }, delay);
        return () => clearTimeout(timeout);
      }
    } else {
      setCurrentText(text);
      setCurrentIndex(0);
    }
    setIsNameUpdate(false);
  }, [currentIndex, delay, text]);

  return [currentText];
};

export default useTypewriterText;
