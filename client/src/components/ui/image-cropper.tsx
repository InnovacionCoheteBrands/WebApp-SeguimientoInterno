import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropperDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedImageBase64: string) => void;
    aspectRatio?: number;
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
): Crop {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export function ImageCropperDialog({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete,
    aspectRatio = 1,
}: ImageCropperDialogProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();

    const onImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspectRatio));
        },
        [aspectRatio]
    );

    const getCroppedImg = useCallback(async (): Promise<string> => {
        if (!imgRef.current || !completedCrop) {
            return imageSrc;
        }

        const image = imgRef.current;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Calculate pixel values from percentage crop
        const pixelCrop = {
            x: (completedCrop.x / 100) * image.naturalWidth,
            y: (completedCrop.y / 100) * image.naturalHeight,
            width: (completedCrop.width / 100) * image.naturalWidth,
            height: (completedCrop.height / 100) * image.naturalHeight,
        };

        // Set canvas size to desired output (256x256 for profile photos)
        const outputSize = 256;
        canvas.width = outputSize;
        canvas.height = outputSize;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            outputSize,
            outputSize
        );

        // Convert to base64 with quality compression
        return canvas.toDataURL("image/jpeg", 0.85);
    }, [completedCrop, imageSrc]);

    const handleConfirm = async () => {
        try {
            const croppedImage = await getCroppedImg();
            onCropComplete(croppedImage);
            onOpenChange(false);
        } catch (error) {
            console.error("Error cropping image:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Recortar Imagen</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        Arrastra para seleccionar la zona de la imagen que deseas usar
                    </p>
                    <div className="max-h-[400px] overflow-hidden rounded-lg border">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                            aspect={aspectRatio}
                            circularCrop={aspectRatio === 1}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Imagen a recortar"
                                onLoad={onImageLoad}
                                style={{ maxHeight: "400px", maxWidth: "100%" }}
                            />
                        </ReactCrop>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleConfirm}>Aplicar Recorte</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
