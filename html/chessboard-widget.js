import { Chessboard, ChessPiece } from "./chessboard.js";

function getStyleRoot() {
    return getComputedStyle(document.documentElement);
}

export class ChessboardWidget extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "closed" });
        this.root.innerHTML = /*html*/`
            <style>
                #board {
                    position: relative;
                    touch-action: none;
                    aspect-ratio: 1;
                    margin: auto;
                    max-height: 100%;
                    display: grid;
                    grid-template-columns: auto auto auto auto auto auto auto auto;
                    caret-color: transparent;
                }
                .squareWhite {
                    position: relative;
                    background-color: var(--squareWhiteColor);
                }
                .squareBlack {
                    position: relative;
                    background-color: var(--squareBlackColor);
                }
                .piece {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    z-index: 1;
                    cursor: grab;
                    transition: translate var(--animationTime) linear;
                    @starting-style {
                        translate: var(--startingX) var(--startingY);
                    }
                }
                #promoteDialogArea {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    z-index: 10;
                }
                #promoteDialog {
                    position: absolute;
                    z-index: 11;
                    background-color: white;
                    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.25);
                }
                .promoteDialogPiece {
                    position: absolute;
                    aspect-ratio: 1;
                    width: 100%;
                    cursor: pointer;
                }
            </style>
            <svg display="none">
                <symbol id="piece_K" viewBox="0 0 45 45" style="fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <path
                    d="M 22.5,11.63 L 22.5,6"
                    style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                    <path
                    d="M 20,8 L 25,8"
                    style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                    <path
                    d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
                    style="fill:#ffffff; stroke:#000000; stroke-linecap:butt; stroke-linejoin:miter;" />
                    <path
                    d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z "
                    style="fill:#ffffff; stroke:#000000;" />
                    <path
                    d="M 11.5,30 C 17,27 27,27 32.5,30"
                    style="fill:none; stroke:#000000;" />
                    <path
                    d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5"
                    style="fill:none; stroke:#000000;" />
                    <path
                    d="M 11.5,37 C 17,34 27,34 32.5,37"
                    style="fill:none; stroke:#000000;" />
                </symbol>    
                <symbol id="piece_Q" viewBox="0 0 45 45" style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <path
                    d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z"
                    transform="translate(-1,-1)" />
                    <path
                    d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z"
                    transform="translate(15.5,-5.5)" />
                    <path
                    d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z"
                    transform="translate(32,-1)" />
                    <path
                    d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z"
                    transform="translate(7,-4.5)" />
                    <path
                    d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z"
                    transform="translate(24,-4)" />
                    <path
                    d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 11.5,30 C 15,29 30,29 33.5,30"
                    style="fill:none;" />
                    <path
                    d="M 12,33.5 C 18,32.5 27,32.5 33,33.5"
                    style="fill:none;" />
                </symbol>
                <symbol id="piece_B" viewBox="0 0 45 45" style="opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <g style="fill:#ffffff; stroke:#000000; stroke-linecap:butt;"> 
                        <path
                        d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
                        <path
                        d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
                        <path
                        d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
                    </g>
                    <path
                    d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"
                    style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                </symbol>
                <symbol id="piece_N" viewBox="0 0 45 45" style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <path
                    d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
                    style="fill:#ffffff; stroke:#000000;" />
                    <path
                    d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
                    style="fill:#ffffff; stroke:#000000;" />
                    <path
                    d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
                    style="fill:#000000; stroke:#000000;" />
                    <path
                    d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z"
                    transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
                    style="fill:#000000; stroke:#000000;" />
                </symbol>
                <symbol id="piece_R" viewBox="0 0 45 45" style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <path
                    d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 34,14 L 31,17 L 14,17 L 11,14" />
                    <path
                    d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"
                    style="stroke-linecap:butt; stroke-linejoin:miter;" />
                    <path
                    d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
                    <path
                    d="M 11,14 L 34,14"
                    style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                </symbol>
                <symbol id="piece_P" viewBox="0 0 45 45">
                    <path
                    d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z "
                    style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" />
                </symbol>
                <symbol id="piece_k" viewBox="0 0 45 45" style="fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <path 
                        d="M 22.5,11.63 L 22.5,6"
                        style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                    <path
                        d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" 
                        style="fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;" />
                    <path
                    d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z "
                    style="fill:#000000; stroke:#000000;" />
                    <path
                    d="M 20,8 L 25,8"
                    style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                    <path
                    d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.51,26.6 L 22.5,24.5 C 20,18 9.906,14 6.997,19.85 C 4.5,25.5 11.85,28.85 11.85,28.85"
                    style="fill:none; stroke:#ffffff;" />
                    <path
                    d="M 11.5,30 C 17,27 27,27 32.5,30 M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5 M 11.5,37 C 17,34 27,34 32.5,37"
                    style="fill:none; stroke:#ffffff;" />
                </symbol>
                <symbol id="piece_q" viewBox="0 0 45 45" style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <g style="fill:#000000; stroke:none;">
                        <circle cx="6"    cy="12" r="2.75" />
                        <circle cx="14"   cy="9"  r="2.75" />
                        <circle cx="22.5" cy="8"  r="2.75" />
                        <circle cx="31"   cy="9"  r="2.75" />
                        <circle cx="39"   cy="12" r="2.75" />
                    </g>
                    <path
                    d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z"
                    style="stroke-linecap:butt; stroke:#000000;" />
                    <path
                    d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 11,38.5 A 35,35 1 0 0 34,38.5"
                    style="fill:none; stroke:#000000; stroke-linecap:butt;" />
                    <path
                    d="M 11,29 A 35,35 1 0 1 34,29"
                    style="fill:none; stroke:#ffffff;" />
                    <path
                    d="M 12.5,31.5 L 32.5,31.5"
                    style="fill:none; stroke:#ffffff;" />
                    <path
                    d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5"
                    style="fill:none; stroke:#ffffff;" />
                    <path
                    d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5"
                    style="fill:none; stroke:#ffffff;" />
                </symbol>
                <symbol id="piece_b" viewBox="0 0 45 45" style="opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <g style="fill:#000000; stroke:#000000; stroke-linecap:butt;"> 
                        <path
                            d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
                        <path
                            d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
                        <path
                            d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
                    </g>
                    <path
                    d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"
                    style="fill:none; stroke:#ffffff; stroke-linejoin:miter;" />
                </symbol>
                <symbol id="piece_n" viewBox="0 0 45 45" style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <path
                    d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
                    style="fill:#000000; stroke:#000000;" />
                    <path
                    d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
                    style="fill:#000000; stroke:#000000;" />
                    <path
                    d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
                    style="fill:#ffffff; stroke:#ffffff;" />
                    <path
                    d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z"
                    transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
                    style="fill:#ffffff; stroke:#ffffff;" />
                    <path
                    d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z "
                    style="fill:#ffffff; stroke:none;" />
                </symbol>
                <symbol id="piece_r" viewBox="0 0 45 45" style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                    <path
                    d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z "
                    style="stroke-linecap:butt;stroke-linejoin:miter;" />
                    <path
                    d="M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z "
                    style="stroke-linecap:butt;" />
                    <path
                    d="M 12,35.5 L 33,35.5 L 33,35.5"
                    style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                    <path
                    d="M 13,31.5 L 32,31.5"
                    style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                    <path
                    d="M 14,29.5 L 31,29.5"
                    style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                    <path
                    d="M 14,16.5 L 31,16.5"
                    style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                    <path
                    d="M 11,14 L 34,14"
                    style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                </symbol>
                <symbol id="piece_p" viewBox="0 0 45 45">
                    <path
                    d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z "
                    style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" />
                </symbol>
            </svg>
        `;

        this.boardWidget = document.createElement("div");
        this.boardWidget.id = "board";
        this.root.appendChild(this.boardWidget);

        for (let y = 0; y < 8; ++y) {
            for (let x = 0; x < 8; ++x) {
                const squareWidget = document.createElement("div");
                squareWidget.id = Chessboard.squareXyToId(x, 8 - 1 - y);
                squareWidget.className = "square" + (Chessboard.isSquareBlack(squareWidget.id) ? "Black" : "White");
                this.boardWidget.appendChild(squareWidget);
            }
        }

        this.movingPiece = null;

        this.board = null;
    }

    set chessboard(board) {
        this.board = board;
        this.updateBoardWidget();
    }

    getSquareWidget(id) {
        return this.root.getElementById(id); // TODO: can convert id to board child index and access child directly
    }

    updateSquareWidget(squareId, animateFromSquareId = null) {
        const squareWidget = this.getSquareWidget(squareId);
        const piece = this.board.getPiece(squareId);
        if (piece === null) {
            squareWidget.replaceChildren();
            squareWidget.onclick = function(e) {
                if (this.movingPiece === null)
                    return;
                const fromSquare = this.movingPiece.parentElement;
                fromSquare.style.backgroundColor = getStyleRoot().getPropertyValue(Chessboard.isSquareBlack(fromSquare.id) ? "--squareBlackColor" : "--squareWhiteColor");
                const toSquare = e.currentTarget; 
                const changedSquares = this.board.movePiece(fromSquare.id, toSquare.id);
                if (changedSquares !== null)
                    this.updateBoardWidget(changedSquares, true);
                this.movingPiece = null;
            }.bind(this);
        }
        else {
            let pieceWidget = null;
            if (animateFromSquareId !== null) {
                const squareClientRect = squareWidget.getBoundingClientRect();
                const fromSquareClientRect = this.getSquareWidget(animateFromSquareId).getBoundingClientRect();
                const pieceTemplate = document.createElement("template");
                pieceTemplate.innerHTML = "<svg class=\"piece\" style=\"--startingX: " + (fromSquareClientRect.x - squareClientRect.x) + "px; --startingY: " + (fromSquareClientRect.y - squareClientRect.y) + "px;\"><use href=\"#piece_" + piece.type + "\"/></svg>";
                squareWidget.appendChild(pieceTemplate.content.firstElementChild);
                pieceWidget = squareWidget.lastElementChild;
                pieceWidget.ontransitionstart = function(e) {
                    this.boardWidget.style.pointerEvents = "none";
                    e.currentTarget.style.zIndex = 2;
                }.bind(this);
                pieceWidget.ontransitionend = function(e)
                {
                    if (squareWidget.children.length > 1)
                        squareWidget.firstElementChild.remove();
                    this.boardWidget.style.pointerEvents = "initial";
                    e.currentTarget.style.zIndex = 1;
                }.bind(this);
            }
            else {
                squareWidget.innerHTML = "<svg class=\"piece\"><use href=\"#piece_" + piece.type + "\"/></svg>";
                pieceWidget = squareWidget.lastElementChild;
            }
            pieceWidget.onclick = function(e) {
                e.stopPropagation();
            }
            pieceWidget.onpointerdown = function(e) {
                if (this.movingPiece !== null) {
                    const fromSquare = this.movingPiece.parentElement;
                    fromSquare.style.backgroundColor = getStyleRoot().getPropertyValue(Chessboard.isSquareBlack(fromSquare.id) ? "--squareBlackColor" : "--squareWhiteColor");
                    const toSquare = e.currentTarget.parentElement;
                    this.movingPiece = null;
                    if (this.board.getPiece(fromSquare.id).isBlack() !== this.board.getPiece(toSquare.id).isBlack()) {
                        const changedSquares = this.board.movePiece(fromSquare.id, toSquare.id);
                        if (changedSquares !== null)
                            this.updateBoardWidget(changedSquares, true);
                        return;
                    }
                }
                this.movingPiece = e.currentTarget;
                this.movingPiece.style.zIndex = 2;
                this.movingPiece.style.cursor = "grabbing";
                this.boardWidget.onpointermove = function(e) {
                    e.preventDefault();
                    if (this.movingPiece === null)
                        return;
                    const fromSquareClientRect = this.movingPiece.parentElement.getBoundingClientRect();
                    this.movingPiece.style.left = (e.clientX - fromSquareClientRect.x - fromSquareClientRect.width/2) + "px";
                    this.movingPiece.style.top = (e.clientY - fromSquareClientRect.y - fromSquareClientRect.height/2) + "px";
                }.bind(this);
                this.boardWidget.onpointerup = function(e) {
                    e.preventDefault();
                    this.boardWidget.onpointermove = null;
                    this.boardWidget.onpointerup = null;
                    if (this.movingPiece === null)
                        return;
                    const fromSquare = this.movingPiece.parentElement;
                    this.movingPiece.style.left = 0;
                    this.movingPiece.style.top = 0;
                    this.movingPiece.style.zIndex = 1;
                    this.movingPiece.style.cursor = "grab";
                    let toSquare = null;
                    for (const squareWidget of this.boardWidget.children) {
                        const squareWidgetClientRect = squareWidget.getBoundingClientRect();
                        if ((e.clientX >= squareWidgetClientRect.left) && (e.clientX < squareWidgetClientRect.right) && (e.clientY >= squareWidgetClientRect.top) && (e.clientY < squareWidgetClientRect.bottom)) {
                            toSquare = squareWidget;
                            break;
                        }
                    }
                    if (toSquare !== null) {
                        if (toSquare.id === fromSquare.id) {
                            fromSquare.style.backgroundColor = getStyleRoot().getPropertyValue(Chessboard.isSquareBlack(fromSquare.id) ? "--squareBlackSelectedColor" : "--squareWhiteSelectedColor");
                            return;
                        }
                        const changedSquares = this.board.movePiece(fromSquare.id, toSquare.id);
                        if (changedSquares !== null)
                            this.updateBoardWidget(changedSquares);
                    }
                    this.movingPiece = null;
                }.bind(this);
            }.bind(this);
        }
    }

    updateBoardWidget(changedSquares = null, animate = false) {
        if (changedSquares === null) {
            for (const squareWidget of this.boardWidget.children)
                this.updateSquareWidget(squareWidget.id);
            return;
        }

        const animationTime = Number(getStyleRoot().getPropertyValue("--animationTime").slice(0, -2));
        
        const updateChangedSquareWidgets = function(changedSquare, animate) {
            this.updateSquareWidget(changedSquare.fromId);
            if (changedSquare.id !== changedSquare.fromId)
                this.updateSquareWidget(changedSquare.id, animate ? changedSquare.fromId : null);
        }.bind(this);
        
        if (animate) {
            updateChangedSquareWidgets(changedSquares[0], true);
            for (let i = 1, n = changedSquares.length; i < n; ++i) {
                const changedSquare = changedSquares[i];
                setTimeout(function() { updateChangedSquareWidgets(changedSquare, true); }, animationTime*i);
            }
        }
        else {
            updateChangedSquareWidgets(changedSquares[0], false);
            if (changedSquares.length > 1) { // always animate secondary moves (such as the rook when castling)
                updateChangedSquareWidgets(changedSquares[1], true);
                for (let i = 2, n = changedSquares.length; i < n; ++i) {
                    const changedSquare = changedSquares[i];
                    setTimeout(function() { updateChangedSquareWidgets(changedSquare, true); }, animationTime*(i - 1));
                }
            }
        }

        if (changedSquares[0].promote === true) {
            const promoteSquareId = changedSquares[0].id;
            if (animate === true)
                setTimeout(function() { this.showPromoteDialog(promoteSquareId); }.bind(this), animationTime);
            else
                this.showPromoteDialog(promoteSquareId);
        }
    }

    showPromoteDialog(squareId) {
        const promoteDialogArea = document.createElement("div");
        promoteDialogArea.id = "promoteDialogArea";
        this.boardWidget.appendChild(promoteDialogArea);
    
        const promoteDialog = document.createElement("div");
        promoteDialog.id = "promoteDialog";
        const squareClientRect = this.getSquareWidget(squareId).getBoundingClientRect();
        const boardClientRect = this.boardWidget.getBoundingClientRect();
        promoteDialog.style.left = (squareClientRect.x - boardClientRect.x)/boardClientRect.width*100 + "%";
        promoteDialog.style.width = squareClientRect.width/boardClientRect.width*100 + "%";
        if (Chessboard.squareIdToY(squareId) < 4) {
            const topSquareClientRect = this.getSquareWidget(Chessboard.squareXyToId(Chessboard.squareIdToX(squareId), Chessboard.squareIdToY(squareId) + 3)).getBoundingClientRect();
            promoteDialog.style.top = (topSquareClientRect.y - boardClientRect.y)/boardClientRect.height*100 + "%";
            promoteDialog.style.height = (squareClientRect.y + squareClientRect.height - topSquareClientRect.y)/boardClientRect.height*100 + "%";
        }
        else {
            const bottomSquareClientRect = this.getSquareWidget(Chessboard.squareXyToId(Chessboard.squareIdToX(squareId), Chessboard.squareIdToY(squareId) - 3)).getBoundingClientRect();
            promoteDialog.style.top = (squareClientRect.y - boardClientRect.y)/boardClientRect.height*100 + "%";
            promoteDialog.style.height = (bottomSquareClientRect.y + bottomSquareClientRect.height - squareClientRect.y)/boardClientRect.height*100 + "%";
        }
        const pieceTypes = this.board.getPiece(squareId).isBlack() ? "nbrq" : "QRBN";            
        let piecesHtml = "";
        for (let i = 0; i < 4; ++i)
            piecesHtml += "<svg class=\"promoteDialogPiece\"><use href=\"#piece_" + pieceTypes[i] + "\"/></svg>";
        promoteDialog.innerHTML = piecesHtml;
        for (let i = 0, pieceWidgets = promoteDialog.children; i < 4; ++i) {
            pieceWidgets[i].style.top = 25*i + "%";
            pieceWidgets[i].onclick = function(e) {
                this.board.getPiece(squareId).type = pieceTypes[i];
                this.updateSquareWidget(squareId);
                this.boardWidget.removeChild(promoteDialogArea);
            }.bind(this);
            pieceWidgets[i].onpointerdown = function(e) {
                e.stopPropagation();
            };
            pieceWidgets[i].onpointerup = function(e) {
                e.stopPropagation();
            };
        }
        promoteDialogArea.onpointerdown = function(e) {
            promoteDialog.style.visibility = "hidden";
        };
        promoteDialogArea.onpointerup = function(e) {
            promoteDialog.style.visibility = "initial";
        };
        promoteDialogArea.appendChild(promoteDialog);
    }
}

customElements.define("chessboard-widget", ChessboardWidget);