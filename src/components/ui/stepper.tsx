"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

const Stepper = ({ steps, currentStep, onStepClick, className }: StepperProps) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Step indicators */}
      <div className="relative flex items-center justify-between">
        {/* Progress line background */}
        <div className="absolute left-0 top-4 h-0.5 w-full bg-muted" />
        {/* Progress line filled */}
        <div
          className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={cn(
                "group relative z-10 flex flex-col items-center",
                isClickable && "cursor-pointer"
              )}
            >
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                  isCompleted && "bg-primary text-white shadow-md shadow-primary/30",
                  isCurrent &&
                    "border-2 border-primary bg-white text-primary shadow-md shadow-primary/20",
                  !isCompleted &&
                    !isCurrent &&
                    "border-2 border-muted bg-white text-muted-foreground",
                  isClickable && "hover:scale-110"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors",
                  isCompleted && "text-primary",
                  isCurrent && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { Stepper };
export type { Step };
