export const convertSvgToPngIfNeeded = (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
        if (!svgDataUrl || !svgDataUrl.startsWith("data:image/svg+xml")) {
            resolve(svgDataUrl);
            return;
        }
        const img = new Image();
        // Allow cross-origin requests
        img.crossOrigin = "anonymous";
        img.src = svgDataUrl;
        img.onload = () => {
            // Delay slightly (500ms) to allow the browser's rendering engine to fully decode and paint nested base64 image data
            setTimeout(() => {
                try {
                    const canvas = document.createElement("canvas");
                    // Maintain high resolution (840x880 or match coordinates)
                    canvas.width = 840;
                    canvas.height = 880;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.fillStyle = "#FAF5EB"; // Aged paper background match
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const pngUrl = canvas.toDataURL("image/png");
                        resolve(pngUrl);
                    } else {
                        resolve(svgDataUrl);
                    }
                } catch (err) {
                    console.error("Error during SVG to PNG conversion:", err);
                    resolve(svgDataUrl);
                }
            }, 500);
        };
        img.onerror = () => {
            resolve(svgDataUrl);
        };
    });
};

export const downloadAsPng = (dataUrl: string, filename: string) => {
    if (!dataUrl) return;
    if (dataUrl.startsWith("data:image/svg+xml")) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = dataUrl;
        img.onload = () => {
            // Delay slightly (500ms) to allow the browser's rendering engine to fully decode and paint nested base64 image data
            setTimeout(() => {
                const canvas = document.createElement("canvas");
                canvas.width = 840;
                canvas.height = 880;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.fillStyle = "#FAF5EB"; // Aged paper background match
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    try {
                        const pngUrl = canvas.toDataURL("image/png");
                        const a = document.createElement("a");
                        a.href = pngUrl;
                        a.download = filename.replace(/\.svg$/, ".png");
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } catch (err) {
                        console.error("Failed to convert SVG to PNG, downloading raw SVG", err);
                        const a = document.createElement("a");
                        a.href = dataUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }
                }
            }, 500);
        };
    } else {
        // It's already a PNG/JPG, download directly
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};
