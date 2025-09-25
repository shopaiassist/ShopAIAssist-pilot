import useTypewriterText from '../../hooks/useTypewriterText';

interface TypewriterTextProps {
  text: string;
  delay: number;
}

/**
 * Component that displays text with a typewriter animation effect.
 *
 * This component uses the `useTypewriterText` hook to animate the display of text, typing out one character at a time.
 *
 * @param {TypewriterTextProps} props - The properties for the TypewriterText component.
 * @param {string} props.text - The text to be animated.
 * @param {number} props.delay - The delay in milliseconds between each character.
 * @returns {JSX.Element} The rendered TypewriterText component.
 *
 * @example
 * <TypewriterText text="Hello, world!" delay={100} />
 */
const TypewriterText = ({ text, delay }: TypewriterTextProps) => {
  const [currentText] = useTypewriterText(text, delay);

  return <>{currentText}</>;
};

export default TypewriterText;
