import { Chessboard } from "./chess.js";

function getStyleRoot() {
    return getComputedStyle(document.documentElement);
}

customElements.define("chesspiece-widget",
    class ChessPieceWidget extends HTMLElement {
        static observedAttributes = ["type"];

        constructor() {
            super();
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (name === "type")
                this.style.backgroundImage = "url('./img/chesspieces.svg#" + newValue + "')";
        }
    }
);

customElements.define("chessboard-widget",
    class ChessboardWidget extends HTMLElement {
        constructor() {
            super();
            this.board = null;
        }

        connectedCallback() {
            this.root = this.attachShadow({ mode: "closed" });

            const styleSheet = new CSSStyleSheet();
            styleSheet.replace(/*css*/`
                :host {
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
            `);

            this.root.adoptedStyleSheets = [styleSheet];

            for (let y = 0; y < 8; ++y) {
                for (let x = 0; x < 8; ++x) {
                    const squareWidget = document.createElement("div");
                    squareWidget.id = Chessboard.squareXyToId(x, 8 - 1 - y);
                    squareWidget.className = "square" + (Chessboard.isSquareBlack(squareWidget.id) ? "Black" : "White");
                    this.root.appendChild(squareWidget);
                }
            }

            this.movingPiece = null;

            if (this.board !== null)
                this.updateBoardWidget();
        }

        set chessboard(board) {
            this.board = board;
            if (this.isConnected)
                this.updateBoardWidget();
        }

        getSquareWidget(id) {
            return this.root.getElementById(id);
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
                const pieceWidget = document.createElement("chesspiece-widget");
                pieceWidget.className = "piece";
                pieceWidget.setAttribute("type", piece.type);
                if (animateFromSquareId !== null) {
                    const squareClientRect = squareWidget.getBoundingClientRect();
                    const fromSquareClientRect = this.getSquareWidget(animateFromSquareId).getBoundingClientRect();
                    pieceWidget.style.setProperty("--startingX", (fromSquareClientRect.x - squareClientRect.x) + "px");
                    pieceWidget.style.setProperty("--startingY", (fromSquareClientRect.y - squareClientRect.y) + "px");
                    pieceWidget.ontransitionstart = function(e) {
                        this.style.pointerEvents = "none";
                        e.currentTarget.style.zIndex = 2;
                    }.bind(this);
                    pieceWidget.ontransitionend = function(e)
                    {
                        while (squareWidget.children.length > 1)
                            squareWidget.firstElementChild.remove();
                        this.style.pointerEvents = "initial";
                        e.currentTarget.style.zIndex = 1;
                    }.bind(this);
                    squareWidget.appendChild(pieceWidget);
                }
                else {
                    squareWidget.replaceChildren(pieceWidget);
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
                    this.onpointermove = function(e) {
                        e.preventDefault();
                        if (this.movingPiece === null)
                            return;
                        const fromSquareClientRect = this.movingPiece.parentElement.getBoundingClientRect();
                        this.movingPiece.style.left = (e.clientX - fromSquareClientRect.x - fromSquareClientRect.width/2) + "px";
                        this.movingPiece.style.top = (e.clientY - fromSquareClientRect.y - fromSquareClientRect.height/2) + "px";
                    }.bind(this);
                    this.onpointerup = function(e) {
                        e.preventDefault();
                        this.onpointermove = null;
                        this.onpointerup = null;
                        if (this.movingPiece === null)
                            return;
                        const fromSquare = this.movingPiece.parentElement;
                        this.movingPiece.style.left = 0;
                        this.movingPiece.style.top = 0;
                        this.movingPiece.style.zIndex = 1;
                        this.movingPiece.style.cursor = "grab";
                        let toSquare = null;
                        for (const squareWidget of this.root.children) {
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
                for (const squareWidget of this.root.children)
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
            this.root.appendChild(promoteDialogArea);
        
            const promoteDialog = document.createElement("div");
            promoteDialog.id = "promoteDialog";
            const squareClientRect = this.getSquareWidget(squareId).getBoundingClientRect();
            const boardClientRect = this.getBoundingClientRect();
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
            for (let i = 0; i < 4; ++i) {
                const pieceType = pieceTypes[i];
                const pieceWidget = document.createElement("chesspiece-widget");
                pieceWidget.className = "promoteDialogPiece";
                pieceWidget.setAttribute("type", pieceType);
                pieceWidget.style.top = String(25*i) + "%";
                pieceWidget.onclick = function(e) {
                    this.board.getPiece(squareId).type = pieceType;
                    this.updateSquareWidget(squareId);
                    this.root.removeChild(promoteDialogArea);
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
                promoteDialog.style.visibility = "initial";
            };
            promoteDialogArea.appendChild(promoteDialog);
        }
    }
);