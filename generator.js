class GenkouyoushiGenerator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvases = [];
    }

    render(config) {
        this.container.innerHTML = '';
        this.canvases = [];

        const {
            widthInches,
            heightInches,
            dpi,
            columns,
            rows,
            marginTop,
            marginBottom,
            marginLeft,
            marginRight,
            furigana,
            direction,
            words
        } = config;

        const width = widthInches * dpi;
        const height = heightInches * dpi;
        const mTop = marginTop * dpi;
        const mBot = marginBottom * dpi;
        const mLeft = marginLeft * dpi;
        const mRight = marginRight * dpi;
        const gridWidth = width - mLeft - mRight;
        const gridHeight = height - mTop - mBot;
        const boxWidth = gridWidth / (furigana ? columns * 1.5 : columns);
        const boxHeight = gridHeight / rows;
        const boxSide = Math.min(boxWidth, boxHeight);
        const actualGridWidth = boxSide * (furigana ? columns * 1.5 : columns);
        const actualGridHeight = boxSide * rows;
        const offsetX = mLeft + (gridWidth - actualGridWidth) / 2;
        const offsetY = mTop + (gridHeight - actualGridHeight) / 2;

        const createNewCanvas = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            this.container.appendChild(canvas);
            this.canvases.push(canvas);

            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = Math.max(1, dpi * 0.005);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';

            // Draw grid
            for (let col = 0; col < columns; col++) {
                for (let row = 0; row < rows; row++) {
                    const x = offsetX + col * boxSide * (furigana ? 1.5 : 1);
                    const y = offsetY + row * boxSide;

                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.strokeRect(x, y, boxSide, boxSide);

                    ctx.setLineDash([dpi * 0.05, dpi * 0.05]);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                    
                    ctx.beginPath();
                    ctx.moveTo(x, y + boxSide / 2);
                    ctx.lineTo(x + boxSide, y + boxSide / 2);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x + boxSide / 2, y);
                    ctx.lineTo(x + boxSide / 2, y + boxSide);
                    ctx.stroke();
                    
                    ctx.setLineDash([]);

                    if (furigana) {
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                        ctx.strokeRect(x + boxSide, y, boxSide * 0.5, boxSide);
                    }
                }
            }

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.font = `${boxSide * 0.7}px "Noto Serif JP", serif`;

            return ctx;
        };

        let currentCtx = createNewCanvas();

        if (words && words.length > 0) {
            const isVertical = direction === 'vertical';
            const inlineSize = isVertical ? rows : columns;
            const blockSize = isVertical ? columns : rows;

            let currentInline = 0;
            let currentBlock = 0;
            let bandBlockSize = 0;

            const drawChar = (ctx, char, col, row, style) => {
                if (col >= columns || row >= rows || col < 0 || row < 0) return;
                const boxX = offsetX + col * boxSide * (furigana ? 1.5 : 1);
                const boxY = offsetY + row * boxSide;
                ctx.fillStyle = style === 'trace' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.9)';
                ctx.fillText(char, boxX + boxSide/2, boxY + boxSide/2);
            };

            for (const word of words) {
                const text = word.text.trim();
                if (!text) continue;
                
                const inlineReq = text.length;
                const blockReq = word.solid + word.trace + word.empty;
                if (blockReq === 0) continue;

                if (currentInline > 0 && currentInline + inlineReq > inlineSize) {
                    currentBlock += bandBlockSize;
                    currentInline = 0;
                    bandBlockSize = 0;
                }

                if (currentBlock + blockReq > blockSize && currentBlock > 0) {
                    currentBlock = 0;
                    currentInline = 0;
                    bandBlockSize = 0;
                    currentCtx = createNewCanvas();
                }

                if (blockReq > bandBlockSize) {
                    bandBlockSize = blockReq;
                }

                for (let b = 0; b < blockReq; b++) {
                    let style = 'empty';
                    if (b < word.solid) style = 'solid';
                    else if (b < word.solid + word.trace) style = 'trace';

                    if (style !== 'empty') {
                        for (let i = 0; i < inlineReq; i++) {
                            const logicalX = currentInline + i;
                            const logicalY = currentBlock + b;
                            
                            let col, row;
                            if (isVertical) {
                                row = logicalX;
                                col = columns - 1 - logicalY;
                            } else {
                                col = logicalX;
                                row = logicalY;
                            }
                            
                            drawChar(currentCtx, text[i], col, row, style);
                        }
                    }
                }

                currentInline += inlineReq + 1;
            }
        }
    }

    getCanvases() {
        return this.canvases;
    }
}

window.GenkouyoushiGenerator = GenkouyoushiGenerator;
