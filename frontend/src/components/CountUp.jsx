import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

const CountUp = ({ to, duration = 1.5, decimals = 0, prefix = '', suffix = '' }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => {
        return latest.toLocaleString('az-AZ', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    });

    useEffect(() => {
        const controls = animate(count, to, { duration: duration, ease: "easeOut" });
        return controls.stop;
    }, [to, duration]);

    return <span>{prefix}{rounded}{suffix}</span>;
};

export default CountUp;
