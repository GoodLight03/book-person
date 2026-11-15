/// <reference types="vite/client" />

declare module 'react-pageflip' {
  import { Component, ReactNode, Ref } from 'react';

  interface HTMLFlipBookProps {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    renderOnlyPageLengthChange?: boolean;
    className?: string;
    style?: React.CSSProperties;
    startPage?: number;
    onFlip?: (e: any) => void;
    onChangeOrientation?: (e: any) => void;
    onChangeState?: (e: any) => void;
    children?: ReactNode;
    ref?: Ref<any>;
  }

  export default class HTMLFlipBook extends Component<HTMLFlipBookProps> {}
}
