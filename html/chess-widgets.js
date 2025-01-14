import { Chessboard, ChessPiece } from "./chess.js";
import { disableMultitouch } from "./disablemultitouch.js";


customElements.define("chesspiece-widget",
    class ChessPieceWidget extends HTMLElement {
        constructor() {
            super();
        }

        set type(newType) {
            if (this.#type === newType)
                return;
            this.#type = newType;
            this.style.backgroundImage = "url('./img/chesspieces.svg#" + newType + "')";
        }

        get type() {
            return this.#type;
        }

        #type = null;
    }
);


customElements.define("chessboard-widget",
    class ChessboardWidget extends HTMLElement {
        constructor() {
            super();
            disableMultitouch(this);
        }

        connectedCallback() {
            if (this.#chessboard === null)
                return;

            if (this.#root === null)
                this.#root = this.attachShadow({ mode: "closed" });

            if (ChessboardWidget.#styleSheetRefs++ === 0) {
                ChessboardWidget.#styleSheet = new CSSStyleSheet();
                ChessboardWidget.#styleSheet.replaceSync(/*css*/`
                    :host {
                        position: relative;
                        touch-action: none;
                        aspect-ratio: 1;
                        margin: auto;
                        max-height: 100%;
                        display: grid;
                        grid-template-columns: auto auto auto auto auto auto auto auto;
                        grid-template-rows: auto auto auto auto auto auto auto auto;
                        caret-color: transparent;
                    }
                    .square {
                        position: relative;
                    }
                    .square.white {
                        background-color: var(--squareWhiteColor);
                    }
                    .square.black {
                        background-color: var(--squareBlackColor);
                    }
                    .square.white.selected {
                        background-color: var(--squareWhiteSelectedColor);
                    }
                    .square.black.selected {
                        background-color: var(--squareBlackSelectedColor);
                    }
                    .piece {
                        position: absolute;
                        width: 100%;
                        height: 100%;
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
                `);
            }
            this.#root.adoptedStyleSheets = [ChessboardWidget.#styleSheet];

            if ((this.#chessboard.xCount !== 8) || (this.#chessboard.yCount !== 8)) {
                let styleSheet = new CSSStyleSheet();
                styleSheet.replaceSync(/*css*/`
                    :host {
                        aspect-ratio: ${this.#chessboard.xCount/this.#chessboard.yCount};
                        grid-template-columns:${" auto".repeat(this.#chessboard.xCount)};
                        grid-template-rows:${" auto".repeat(this.#chessboard.yCount)};
                    }
                `);
                this.#root.adoptedStyleSheets.push(styleSheet);
            }

            for (let y = 0; y < this.#chessboard.yCount; ++y) {
                for (let x = 0; x < this.#chessboard.xCount; ++x) {
                    const squareWidget = document.createElement("div");
                    squareWidget.id = Chessboard.squareXyToId(x, this.#chessboard.yCount - 1 - y);
                    squareWidget.className = "square " + (Chessboard.isSquareBlack(squareWidget.id) ? "black" : "white");
                    this.#root.appendChild(squareWidget);
                }
            }

            this.#movingPiece = null;

            this.#updateWidget();
        }
        
        disconnectedCallback() {
            if (this.#chessboard === null)
                return;
            this.#root.replaceChildren();            
            this.#root.adoptedStyleSheets = [];
            if (--ChessboardWidget.#styleSheetRefs === 0)
                ChessboardWidget.#styleSheet = null;
        }

        set chessboard(newChessboard) {
            if (this.#chessboard === newChessboard)
                return;
            if (this.isConnected)
                this.disconnectedCallback();
            this.#chessboard = newChessboard;
            if (this.isConnected)
                this.connectedCallback();
        }

        #getSquareWidget(id) {
            return this.#root.getElementById(id);
        }

        #updateSquareWidget(squareId, animateFromSquareId = null) {
            const squareWidget = this.#getSquareWidget(squareId);
            const piece = this.#chessboard.getPiece(squareId);
            if (piece === null) {
                squareWidget.replaceChildren();
                squareWidget.onclick = function(e) {
                    if (this.#movingPiece === null)
                        return;
                    const fromSquare = this.#movingPiece.parentElement;
                    fromSquare.classList.remove("selected");
                    const changedSquares = this.#chessboard.movePiece(fromSquare.id, squareWidget.id);
                    if (changedSquares !== null)
                        this.#updateWidget(changedSquares, true);
                    this.#movingPiece = null;
                }.bind(this);
            }
            else {
                const pieceWidget = document.createElement("chesspiece-widget");
                pieceWidget.className = "piece";
                pieceWidget.type = piece.type;
                if (animateFromSquareId !== null) {
                    const squareClientRect = squareWidget.getBoundingClientRect();
                    const fromSquareClientRect = this.#getSquareWidget(animateFromSquareId).getBoundingClientRect();
                    pieceWidget.style.setProperty("--startingX", (fromSquareClientRect.x - squareClientRect.x) + "px");
                    pieceWidget.style.setProperty("--startingY", (fromSquareClientRect.y - squareClientRect.y) + "px");
                    pieceWidget.ontransitionstart = function(e) {
                        this.style.pointerEvents = "none";
                        pieceWidget.style.zIndex = 1;
                    }.bind(this);
                    pieceWidget.ontransitionend = function(e)
                    {
                        const pieceWidgets = squareWidget.querySelectorAll("chesspiece-widget");
                        for (let i = 0; i < (pieceWidgets.length - 1); ++i)
                            pieceWidgets[i].remove();
                        this.style.pointerEvents = "";
                        pieceWidget.style.zIndex = "";
                    }.bind(this);
                    squareWidget.appendChild(pieceWidget);
                }
                else {
                    squareWidget.replaceChildren(pieceWidget);
                }
                pieceWidget.onmouseenter = function(e) {
                    pieceWidget.style.cursor = (ChessPiece.isBlack(pieceWidget.type) === this.#chessboard.blacksTurn) ? "grab" : "";
                }.bind(this);
                pieceWidget.onclick = function(e) {
                    e.stopPropagation();
                }
                pieceWidget.onpointerdown = function(e) {
                    e.preventDefault();                    
                    if (this.#movingPiece !== null) {
                        const fromSquare = this.#movingPiece.parentElement;
                        fromSquare.classList.remove("selected");
                        const toSquare = pieceWidget.parentElement;
                        this.#movingPiece = null;
                        if (this.#chessboard.getPiece(fromSquare.id).isBlack() !== this.#chessboard.getPiece(toSquare.id).isBlack()) {
                            const changedSquares = this.#chessboard.movePiece(fromSquare.id, toSquare.id);
                            if (changedSquares !== null)
                                this.#updateWidget(changedSquares, true);
                            return;
                        }
                    }
                    if (ChessPiece.isBlack(pieceWidget.type) !== this.#chessboard.blacksTurn)
                        return;
                    this.#movingPiece = pieceWidget;
                    this.#movingPiece.style.zIndex = 1;
                    this.#movingPiece.style.cursor = "grabbing";
                    this.onpointermove = function(e) {
                        e.preventDefault();
                        if (this.#movingPiece === null)
                            return;
                        const fromSquareClientRect = this.#movingPiece.parentElement.getBoundingClientRect();
                        this.#movingPiece.style.left = (e.clientX - fromSquareClientRect.x - fromSquareClientRect.width/2) + "px";
                        this.#movingPiece.style.top = (e.clientY - fromSquareClientRect.y - fromSquareClientRect.height/2) + "px";
                    }.bind(this);
                    this.onpointerup = function(e) {
                        e.preventDefault();
                        this.onpointermove = null;
                        this.onpointerup = null;
                        if (this.#movingPiece === null)
                            return;
                        const fromSquare = this.#movingPiece.parentElement;
                        this.#movingPiece.style.left = 0;
                        this.#movingPiece.style.top = 0;
                        this.#movingPiece.style.zIndex = "";
                        //this.#movingPiece.style.cursor = "grab";
                        let toSquare = null;
                        const squareWidgets = this.#root.querySelectorAll(".square");
                        for (const squareWidget of squareWidgets) {
                            const squareWidgetClientRect = squareWidget.getBoundingClientRect();
                            if ((e.clientX >= squareWidgetClientRect.left) && (e.clientX < squareWidgetClientRect.right) && (e.clientY >= squareWidgetClientRect.top) && (e.clientY < squareWidgetClientRect.bottom)) {
                                toSquare = squareWidget;
                                break;
                            }
                        }
                        if (toSquare !== null) {
                            if (toSquare.id === fromSquare.id) {
                                fromSquare.classList.add("selected");
                                return;
                            }
                            const changedSquares = this.#chessboard.movePiece(fromSquare.id, toSquare.id);
                            if (changedSquares !== null)
                                this.#updateWidget(changedSquares);
                        }
                        this.#movingPiece = null;
                    }.bind(this);
                }.bind(this);
            }
        }

        #updateWidget(changedSquares = null, animate = false) {
            if (changedSquares === null) {        
                for (let y = 0; y < this.#chessboard.yCount; ++y)
                    for (let x = 0; x < this.#chessboard.xCount; ++x)
                        this.#updateSquareWidget(Chessboard.squareXyToId(x, y));
                return;
            }

            const animationTime = Number(getComputedStyle(document.documentElement).getPropertyValue("--animationTime").slice(0, -2));
            
            const updateChangedSquareWidgets = function(changedSquare, animate) {
                this.#updateSquareWidget(changedSquare.fromId);
                if (changedSquare.id !== changedSquare.fromId)
                    this.#updateSquareWidget(changedSquare.id, animate ? changedSquare.fromId : null);
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
                    setTimeout(function() { this.#showPromoteDialog(promoteSquareId); }.bind(this), animationTime);
                else
                    this.#showPromoteDialog(promoteSquareId);
            }
        }

        #showPromoteDialog(squareId) {
            const promoteDialogArea = document.createElement("div");
            promoteDialogArea.id = "promoteDialogArea";
            this.#root.appendChild(promoteDialogArea);
        
            const promoteDialog = document.createElement("div");
            promoteDialog.id = "promoteDialog";
            const squareClientRect = this.#getSquareWidget(squareId).getBoundingClientRect();
            const boardClientRect = this.getBoundingClientRect();
            promoteDialog.style.left = (squareClientRect.x - boardClientRect.x)/boardClientRect.width*100 + "%";
            promoteDialog.style.width = squareClientRect.width/boardClientRect.width*100 + "%";
            if (Chessboard.squareIdToY(squareId) < 4) {
                const topSquareClientRect = this.#getSquareWidget(Chessboard.squareXyToId(Chessboard.squareIdToX(squareId), Chessboard.squareIdToY(squareId) + 3)).getBoundingClientRect();
                promoteDialog.style.top = (topSquareClientRect.y - boardClientRect.y)/boardClientRect.height*100 + "%";
                promoteDialog.style.height = (squareClientRect.y + squareClientRect.height - topSquareClientRect.y)/boardClientRect.height*100 + "%";
            }
            else {
                const bottomSquareClientRect = this.#getSquareWidget(Chessboard.squareXyToId(Chessboard.squareIdToX(squareId), Chessboard.squareIdToY(squareId) - 3)).getBoundingClientRect();
                promoteDialog.style.top = (squareClientRect.y - boardClientRect.y)/boardClientRect.height*100 + "%";
                promoteDialog.style.height = (bottomSquareClientRect.y + bottomSquareClientRect.height - squareClientRect.y)/boardClientRect.height*100 + "%";
            }
            const pieceTypes = this.#chessboard.getPiece(squareId).isBlack() ? "nbrq" : "QRBN";
            for (let i = 0; i < 4; ++i) {
                const pieceType = pieceTypes[i];
                const pieceWidget = document.createElement("chesspiece-widget");
                pieceWidget.className = "promoteDialogPiece";
                pieceWidget.type = pieceType;
                pieceWidget.style.top = String(25*i) + "%";
                pieceWidget.onclick = function(e) {
                    this.#chessboard.getPiece(squareId).type = pieceType;
                    this.#updateSquareWidget(squareId);
                    this.#root.removeChild(promoteDialogArea);
                }.bind(this);
                pieceWidget.onpointerdown = function(e) {
                    e.stopPropagation();
                };
                pieceWidget.onpointerup = function(e) {
                    e.stopPropagation();
                };
                promoteDialog.appendChild(pieceWidget);
            }
            promoteDialogArea.onpointerdown = function(e) {
                promoteDialog.style.visibility = "hidden";
            };
            promoteDialogArea.onpointerup = function(e) {
                promoteDialog.style.visibility = "";
            };
            promoteDialogArea.appendChild(promoteDialog);
        }

        #chessboard = null;
        #root = null;
        static #styleSheet = null;
        static #styleSheetRefs = 0;
        #movingPiece = null;
    }
);