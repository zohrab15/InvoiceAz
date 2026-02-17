import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const CountUp = ({ to, duration = 1.5, decimals = 0, prefix = '', suffix = '' }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => {
        return (latest || 0).toLocaleString('az-AZ', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    });

    useEffect(() => {
        const controls = animate(count, to, { duration: duration, ease: "easeOut" });
        return controls.stop;
    }, [to, duration]);

    return <motion.span>{prefix}{rounded}{suffix}</motion.span>;
};

export default CountUp;
