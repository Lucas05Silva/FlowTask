"use client";

import { forwardRef, useEffect, useState, type InputHTMLAttributes } from "react";
import { Input } from "./Input";

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number; // in reais (e.g. 1500.50)
  onChange: (value: number) => void; // returns reais (e.g. 1500.50)
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput({ value, onChange, className, ...props }, ref) {
    const [displayValue, setDisplayValue] = useState("");

    const format = (val: number): string => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val);
    };

    useEffect(() => {
      setDisplayValue(format(value));
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const cents = raw ? parseInt(raw, 10) : 0;
      const reais = cents / 100;
      setDisplayValue(format(reais));
      onChange(reais);
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        className={className}
        {...props}
      />
    );
  }
);
