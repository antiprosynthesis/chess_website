export class ChessPiece {
    type = null;
    moved = false;

    constructor(type) {
        this.type = type;
    }

    static isBlack(type) {
        return (type === type.toLowerCase());
    }

    isBlack() {
        return ChessPiece.isBlack(this.type);
    }

    getBasicMoves(capture = false) {
        switch (this.type) {
            case "K": case "k":
                return { steps: [[0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]], maxSteps: 1 };
            case "Q": case "q":
                return { steps: [[0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]], maxSteps: 8 - 1 };
            case "R": case "r":
                return { steps: [[0, 1], [-1, 0], [0, -1], [1, 0]], maxSteps: 8 - 1 };
            case "B": case "b":
                return { steps: [[-1, 1], [-1, -1], [1, -1], [1, 1]], maxSteps: 8 - 1 };
            case "N": case "n":
                return { steps: [[-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1], [2, 1], [1, 2]], maxSteps: 1 };
            case "P":
                return { steps: capture ? [[-1, 1], [1, 1]] : [[0, 1]], maxSteps: (this.moved || capture) ? 1 : 2 };
            case "p":
                return { steps: capture ? [[1, -1], [-1, -1]] : [[0, -1]], maxSteps: (this.moved || capture) ? 1 : 2 };
            default:
                return null;
        }
    }
}

export class Chessboard {
    blacksTurn = false;

    constructor(xCount = 8, yCount = 8) {
        this.#xCount = xCount;
        this.#yCount = yCount;
        for (let i = 0; i < xCount*yCount; ++i)
            this.#squares.push(null);
    }

    get xCount() {
        return this.#xCount;
    }
    get yCount() {
        return this.#yCount;
    }

    movePiece(squareId, toSquareId, testOnly = false, allowCheck = false, allowCastling = true, allowEnPassant = true) {
        if (squareId === toSquareId)
            return null; // can't move to same square
        const squareX = Chessboard.squareIdToX(squareId);
        const squareY = Chessboard.squareIdToY(squareId);
        const toSquareX = Chessboard.squareIdToX(toSquareId);
        const toSquareY = Chessboard.squareIdToY(toSquareId);
        const piece = this.#squares[this.#squareXyToIndex(squareX, squareY)];
        if (piece === null)
            return null; // no piece to move
        const toPiece = this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)];
        if ((toPiece !== null) && (piece.isBlack() === toPiece.isBlack()))
            return null; // can't move to square with same color piece
        if (allowCastling && ((piece.type === "K") || (piece.type === "k")) && (Math.abs(toSquareX - squareX) === 2) && (toSquareY === squareY)) {
            if (piece.moved)
                return null; // can't castle because king already moved
            const dSquareX = toSquareX - squareX;
            const rookSquareX = (dSquareX < 0) ? 0 : (this.#xCount - 1);
            const rookPiece = this.#squares[this.#squareXyToIndex(rookSquareX, squareY)];
            if ((rookPiece === null) || (rookPiece.type !== ((piece.type === "k") ? "r" : "R")))
                return null; // can't castle because no rook at edge of board
            if (rookPiece.moved)
                return null; // can't castle because rook already moved
            for (let x = Math.min(squareX, rookSquareX) + 1, x1 = Math.max(squareX, rookSquareX) - 1; x <= x1; ++x) {
                if (this.#squares[this.#squareXyToIndex(x, squareY)] !== null)
                    return null; // can't castle because pieces in the way
            }
            if (this.getAttackers(squareId).length !== 0)
                return null; // can't castle because king is in check
            for (let x = (dSquareX < 0) ? toSquareX : (squareX + 1), x1 = (dSquareX < 0) ? (squareX - 1) : toSquareX; x <= x1; ++x) {
                const attackers = this.getAttackers(Chessboard.squareXyToId(x, squareY));
                for (const attacker of attackers) {
                    if (this.#squares[this.#squareIdToIndex(attacker)].isBlack() !== piece.isBlack())
                        return null; // can't castle because one or more target squares are in check
                }
            }
            const toRookSquareX = (dSquareX < 0) ? (toSquareX + 1) : (toSquareX - 1);
            if (!testOnly) {
                this.#squares[this.#squareXyToIndex(squareX, squareY)] = null;
                this.#squares[this.#squareXyToIndex(toSquareX, squareY)] = piece;
                piece.moved = true;
                this.#squares[this.#squareXyToIndex(rookSquareX, squareY)] = null;
                this.#squares[this.#squareXyToIndex(toRookSquareX, squareY)] = rookPiece;
                rookPiece.moved = true;
                this.#enPassantPawnSquareId = null;
                this.blacksTurn = !this.blacksTurn;
            }
            return [{id: toSquareId, fromId: squareId}, {id: Chessboard.squareXyToId(toRookSquareX, squareY), fromId: Chessboard.squareXyToId(rookSquareX, squareY)}];
        }
        if (allowEnPassant && ((piece.type === "P") || (piece.type === "p")) && (this.#enPassantPawnSquareId !== null)) {
            const enPassantPawnSquareX = Chessboard.squareIdToX(this.#enPassantPawnSquareId);
            const enPassantPawnSquareY = Chessboard.squareIdToY(this.#enPassantPawnSquareId);
            const enPassantPawn = this.#squares[this.#squareXyToIndex(enPassantPawnSquareX, enPassantPawnSquareY)];
            if ((piece.isBlack() !== enPassantPawn.isBlack()) && ((squareX === (enPassantPawnSquareX - 1)) || (squareX === (enPassantPawnSquareX + 1))) && (toSquareX === enPassantPawnSquareX) && (toSquareY === (enPassantPawnSquareY + (enPassantPawn.isBlack() ? 1 : -1)))) {
                if (!allowCheck) {
                    this.#squares[this.#squareXyToIndex(squareX, squareY)] = null;
                    this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = piece;
                    this.#squares[this.#squareXyToIndex(enPassantPawnSquareX, enPassantPawnSquareY)] = null;
                    const inCheck = this.isInCheck(piece.isBlack());
                    this.#squares[this.#squareXyToIndex(enPassantPawnSquareX, enPassantPawnSquareY)] = enPassantPawn;
                    this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = null;
                    this.#squares[this.#squareXyToIndex(squareX, squareY)] = piece;
                    if (inCheck)
                        return null; // move causes check
                }
                const enPassantPawnSquareId = this.#enPassantPawnSquareId;
                if (!testOnly) {
                    this.#squares[this.#squareXyToIndex(squareX, squareY)] = null;
                    this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = piece;
                    this.#squares[this.#squareXyToIndex(enPassantPawnSquareX, enPassantPawnSquareY)] = null;
                    piece.moved = true;
                    this.#enPassantPawnSquareId = null;
                    this.blacksTurn = !this.blacksTurn;
                }
                return [{id: toSquareId, fromId: squareId}, {id: enPassantPawnSquareId, fromId: enPassantPawnSquareId}];
            }
        }
        let valid = false;
        const basicMoves = piece.getBasicMoves(toPiece !== null);
        for (const basicSteps of basicMoves.steps) {
            let pieceX = squareX;
            let pieceY = squareY;
            for (let step = 1; step <= basicMoves.maxSteps; ++step) {
                pieceX += basicSteps[0];
                pieceY += basicSteps[1];
                if ((pieceX === toSquareX) && (pieceY === toSquareY)) {
                    valid = true;
                    break;
                }
                if ((pieceX < 0) || (pieceY < 0) || (pieceX >= this.#xCount) || (pieceY >= this.#yCount))
                    break; // out of bounds
                if (this.#squares[this.#squareXyToIndex(pieceX, pieceY)] !== null)
                    break; // piece in the way
            }
            if (valid)
                break;
        }
        if (!valid)
            return null; // not a valid basic move
        if (!allowCheck) {
            const oldToPiece = this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)];
            this.#squares[this.#squareXyToIndex(squareX, squareY)] = null;
            this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = piece;
            const inCheck = this.isInCheck(piece.isBlack());
            this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = oldToPiece;
            this.#squares[this.#squareXyToIndex(squareX, squareY)] = piece;
            if (inCheck)
                return null; // move causes check
        }
        if (!testOnly) {
            this.#squares[this.#squareXyToIndex(squareX, squareY)] = null;
            this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = piece;
            piece.moved = true;
            this.#enPassantPawnSquareId = (((piece.type === "P") || (piece.type === "p")) && (toSquareX === squareX) && (Math.abs(toSquareY - squareY) == 2)) ? toSquareId : null;
            this.blacksTurn = !this.blacksTurn;
        }
        return [{id: toSquareId, fromId: squareId, promote: ((((piece.type === "P") && (toSquareY === (this.#yCount - 1))) || ((piece.type === "p") && (toSquareY === 0))))}];
    }

    // untested:
    getPossibleMoves(squareId, allowCheck = false, allowCastling = true, allowEnPassant = true) {
        const squareX = Chessboard.squareIdToX(squareId);
        const squareY = Chessboard.squareIdToY(squareId);
        const piece = this.#squares[this.#squareXyToIndex(squareX, squareY)];
        if (piece === null)
            return []; // no piece to move
        const possibleMoves = [];
        const basicMoves = piece.getBasicMoves();
        for (const basicSteps of basicMoves.steps) {
            let toSquareX = squareX;
            let toSquareY = squareY;
            for (let step = 1; step <= basicMoves.maxSteps; ++step) {
                toSquareX += basicSteps[0];
                toSquareY += basicSteps[1];
                if ((toSquareX < 0) || (toSquareY < 0) || (toSquareX >= this.#xCount) || (toSquareY >= this.#yCount))
                    break; // move out of bounds
                const toPiece = this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)];
                if (toPiece !== null) {
                    if (toPiece.isBlack() === piece.isBlack())
                        break; // can't move to square with same color piece
                    if ((piece.type === "P") || (piece.type === "p"))
                        break; // pawn can't move-capture
                }
                if (!allowCheck) {
                    this.#squares[this.#squareXyToIndex(squareX, squareY)] = null;
                    this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = piece;
                    const inCheck = this.isInCheck(piece.isBlack());
                    this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = toPiece;
                    this.#squares[this.#squareXyToIndex(squareX, squareY)] = piece;
                    if (inCheck)
                        break; // move causes check
                }
                possibleMoves.push(Chessboard.squareXyToId(toSquareX, toSquareY));
            }
        }
        if ((piece.type === "P") || (piece.type === "p")) {
            const captureMoves = piece.getBasicMoves(capture);
            for (const captureSteps of captureMoves.steps) {
                const toSquareX = squareX + captureSteps[0];
                const toSquareY = squareY + captureSteps[1];
                if ((toSquareX < 0) || (toSquareY < 0) || (toSquareX >= this.#xCount) || (toSquareY >= this.#yCount))
                    continue; // move out of bounds
                const toPiece = this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)];
                if (toPiece === null)
                    if (!allowEnPassant || (this.#enPassantPawnSquareId === null) || (this.movePiece(squareId, Chessboard.squareXyToId(toSquareX, toSquareY), true, allowCheck, allowCastling, allowEnPassant) === null))
                        continue;
                else {
                    if (toPiece.isBlack() === piece.isBlack())
                        continue; // can't capture piece of same color
                    if (!allowCheck) {
                        this.#squares[this.#squareXyToIndex(squareX, squareY)] = null;
                        this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = piece;
                        const inCheck = this.isInCheck(piece.isBlack());
                        this.#squares[this.#squareXyToIndex(toSquareX, toSquareY)] = toPiece;
                        this.#squares[this.#squareXyToIndex(squareX, squareY)] = piece;
                        if (inCheck)
                            continue; // move causes check
                    }
                }
                possibleMoves.push(Chessboard.squareXyToId(toSquareX, toSquareY));
            }
        }
        if (allowCastling && ((piece.type === "K") || (piece.type === "k")) && !piece.moved) {
            if ((squareX + 2) < this.#xCount) {
                const toSquareId = Chessboard.squareXyToId(squareX + 2, squareY);
                if (this.movePiece(squareId, toSquareId, true, allowCheck, allowCastling, allowEnPassant) !== null)
                    possibleMoves.push(toSquareId)
            }
            if ((squareX - 2) >= this.#xCount) {
                const toSquareId = Chessboard.squareXyToId(squareX - 2, squareY);
                if (this.movePiece(squareId, toSquareId, true, allowCheck, allowCastling, allowEnPassant) !== null)
                    possibleMoves.push(toSquareId)
            }
        }
        return possibleMoves;
    }

    getAttackers(squareId, allowCheck = true) {
        const attackers = [];
        const squareX = Chessboard.squareIdToX(squareId);
        const squareY = Chessboard.squareIdToY(squareId);
        for (let i = 0; i < this.#squares.length; ++i) {
            const fromSquareId = this.#squareIndexToId(i);
            if (this.movePiece(fromSquareId, squareId, true, allowCheck, false, false) !== null)
                attackers.push(fromSquareId);
        }
        return attackers;
    }

    isInCheck(black) {
        const kingSquareIds = this.findPiece(black ? "k" : "K");
        for (const kingSquareId of kingSquareIds) {
            if (this.getAttackers(kingSquareId).length !== 0)
                return true;
        }
        return false;
    }

    canMoveAnyPiece(black) {
        for (let i = 0; i < this.#squares.length; ++i) {
            const piece = this.#squares[i];
            if ((piece === null) || (piece.isBlack() !== black))
                continue;
            if (getPossibleMoves(this.#squareIndexToId(i)).length !== 0)
                return true;
        }
        return false;
    }

    findPiece(type) {
        const squareIds = [];
        for (let i = 0; i < this.#squares.length; ++i) {
            const square = this.#squares[i];
            if ((square !== null) && (square.type === type))
                squareIds.push(this.#squareIndexToId(i));
        }
        return squareIds;
    }

    getPiece(squareId) {
        return this.#squares[this.#squareIdToIndex(squareId)];
    }
    setPiece(squareId, piece) {
        this.#squares[this.#squareIdToIndex(squareId)] = piece;
    }

    static isSquareBlack(squareId) {
        return ((Chessboard.squareIdToX(squareId) & 1) === (Chessboard.squareIdToY(squareId) & 1));
    }

    static squareIdToX(id) {
        return id.charCodeAt(0) - "a".charCodeAt(0);
    }
    static squareIdToY(id) {
        return id.charCodeAt(1) - "1".charCodeAt(0);
    }
    static squareXyToId(x, y) {
        return String.fromCharCode("a".charCodeAt(0) + x) + String.fromCharCode("1".charCodeAt(0) + y);
    }

    #squareXyToIndex(x, y) {
        return y*this.#xCount + x;
    }
    #squareIndexToX(index) {
        return index % this.#xCount;
    }
    #squareIndexToY(index) {
        return ~~(index/this.#xCount);
    }

    #squareIdToIndex(id) {
        return this.#squareXyToIndex(Chessboard.squareIdToX(id), Chessboard.squareIdToY(id));
    }
    #squareIndexToId(index) {
        return Chessboard.squareXyToId(this.#squareIndexToX(index), this.#squareIndexToY(index));
    }

    #xCount = 8;
    #yCount = 8;
    #squares = [];
    #enPassantPawnSquareId = null;
}