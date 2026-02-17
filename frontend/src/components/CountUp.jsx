import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

const CountUp = ({ to, duration = 1.5, decimals = 0, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const targetValue = parseFloat(to) || 0;
        const controls = animate(0, targetValue, {
            duration: duration,
            ease: "easeOut",
            onUpdate: (value) => setDisplayValue(value)
        });
        return () => controls.stop();
    }, [to, duration]);

    return (
        <span>
            {prefix}
            {displayValue.toLocaleString('az-AZ', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            })}
            {suffix}
        </span>
    );
};

export default CountUp;
