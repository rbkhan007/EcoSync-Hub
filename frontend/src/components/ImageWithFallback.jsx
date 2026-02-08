import React, { useState } from 'react';
import { Box } from '@mui/material';

const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=200";

const ImageWithFallback = ({ src, alt, sx, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src);

    const onError = () => {
        if (imgSrc !== DEFAULT_PRODUCT_IMAGE) {
            setImgSrc(DEFAULT_PRODUCT_IMAGE);
        }
    };

    return (
        <Box
            component="img"
            src={imgSrc}
            alt={alt}
            sx={sx}
            onError={onError}
            {...props}
        />
    );
};

export default ImageWithFallback;