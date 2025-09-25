import MatterBodyContent, { MatterBodyContentProps } from './content/MatterBodyContent';

export interface MatterBodyProps extends MatterBodyContentProps {}

/**
 * The container to the right of the sidebar, which displays the content of the selected folder or chat.
 *
 * It may optionally include a header for navigating different sections of content.
 *
 * ```
 * ╭―MatterBody―――――――――――――――――――――――――――――――――――――――――――――――――╮
 * │ ╭―MatterBodyHeader―――――――――――――――――――――――――――――――――――――――╮ │
 * │ │ (optional, sometimes empty)                            │ │
 * │ │                                                        │ │
 * │ └――――――――――――――――――――――――――――――――――――――――――――――――――――――――┘ │
 * │ ╭―MatterBodyContent――――――――――――――――――――――――――――――――――――――╮ │
 * │ │                                                        │ │
 * │ │ details for the matter or chat                         │ │
 * │ │                                                        │ │
 * │ │                                                        │ │
 * │ │                                                        │ │
 * │ │                                                        │ │
 * │ │                                                        │ │
 * │ └――――――――――――――――――――――――――――――――――――――――――――――――――――――――┘ │
 * └────────────────────────────────────────────────────────────┘
 * ```
 */
const MatterBody = (props: MatterBodyProps) => {
  return <MatterBodyContent {...props} />;
};

export default MatterBody;
