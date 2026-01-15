import React, { useEffect, useState } from 'react';
import { Target, Check } from 'lucide-react';

interface LoadingStepsProps {
  firstName: string;
  onComplete: () => void;
}

export const LoadingSteps: React.FC<LoadingStepsProps> = ({ firstName, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgresses, setStepProgresses] = useState<number[]>([0, 0, 0, 0, 0]);
  const [isComplete, setIsComplete] = useState(false);

  // Usar ref para evitar reinício do useEffect quando onComplete muda
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const steps = [
    `Analisando necessidades de ${firstName}`,
    'Adequando metodologia Ouse Passar',
    'Gerando planejamento personalizado',
    `Refinando as técnicas para o perfil de ${firstName}`,
    `Gerando a apresentação do planejamento de ${firstName}`
  ];

  useEffect(() => {
    // Gerar padrões aleatórios para cada etapa
    const generateRandomPattern = () => {
      const segments: { until: number; speed: number; pause?: number }[] = [];
      let currentPos = 0;

      while (currentPos < 100) {
        const segmentSize = 8 + Math.random() * 17;
        const until = Math.min(100, currentPos + segmentSize);
        const rand = Math.random();

        if (rand < 0.08 && currentPos > 15 && currentPos < 85) {
          segments.push({
            until: Math.min(100, currentPos + 3),
            speed: 0,
            pause: 400 + Math.random() * 800
          });
          currentPos += 3;
        } else if (rand < 0.25) {
          segments.push({ until, speed: 0.2 + Math.random() * 0.3 });
          currentPos = until;
        } else if (rand < 0.45) {
          segments.push({ until, speed: 0.5 + Math.random() * 0.4 });
          currentPos = until;
        } else if (rand < 0.75) {
          segments.push({ until, speed: 0.9 + Math.random() * 0.5 });
          currentPos = until;
        } else {
          segments.push({ until, speed: 1.4 + Math.random() * 0.8 });
          currentPos = until;
        }
      }

      return segments;
    };

    const stepPatterns = steps.map(() => generateRandomPattern());
    const stepDurations = steps.map(() => 3000 + Math.random() * 2000);
    const progressValues = [0, 0, 0, 0, 0];
    let currentStepIdx = 0;
    let isPaused = false;
    let pauseEndTime = 0;
    let lastPauseSegmentIdx = -1;

    const interval = setInterval(() => {
      const now = Date.now();

      if (currentStepIdx >= steps.length) {
        return;
      }

      if (isPaused) {
        if (now >= pauseEndTime) {
          isPaused = false;
        }
        return;
      }

      const pattern = stepPatterns[currentStepIdx];
      const stepDuration = stepDurations[currentStepIdx];
      const displayedProgress = progressValues[currentStepIdx];

      let segmentIdx = 0;
      for (let i = 0; i < pattern.length; i++) {
        if (displayedProgress < pattern[i].until) {
          segmentIdx = i;
          break;
        }
        segmentIdx = i;
      }

      const currentSegment = pattern[segmentIdx];

      if (currentSegment.speed === 0 && currentSegment.pause && segmentIdx !== lastPauseSegmentIdx) {
        isPaused = true;
        pauseEndTime = now + currentSegment.pause;
        lastPauseSegmentIdx = segmentIdx;
        return;
      }

      const baseIncrement = (50 / stepDuration) * 100;
      const speedMultiplier = currentSegment.speed || 0.1;
      let increment = baseIncrement * speedMultiplier;

      const variation = 0.7 + Math.random() * 0.6;
      increment *= variation;

      if (speedMultiplier < 0.8 && Math.random() < 0.05) {
        return;
      }

      if (Math.random() < 0.03) {
        increment *= 0.1;
      }

      const newProgress = Math.min(100, displayedProgress + increment);
      progressValues[currentStepIdx] = newProgress;

      setCurrentStep(currentStepIdx);
      setStepProgresses([...progressValues]);

      if (newProgress >= 100) {
        currentStepIdx++;
        lastPauseSegmentIdx = -1;

        if (currentStepIdx >= steps.length) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => onCompleteRef.current(), 1000);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [firstName, steps.length]);

  const getStepState = (index: number) => {
    const progress = stepProgresses[index];
    if (isComplete || progress >= 100) {
      return 'completed';
    }
    if (index === currentStep) {
      return 'active';
    }
    if (index < currentStep) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Target className="w-10 h-10 text-brand-yellow" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase mb-2">
            Preparando seu planejamento
          </h2>
          <p className="text-gray-400">Aguarde enquanto personalizamos tudo para você</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const state = getStepState(index);

            return (
              <div key={index} className="bg-brand-card border border-white/5 p-4 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold uppercase ${state !== 'pending' ? 'text-white' : 'text-gray-600'}`}>
                    {step}
                  </span>
                  {state === 'completed' && (
                    <Check className="w-5 h-5 text-green-400" />
                  )}
                </div>

                {state === 'active' && (
                  <div className="relative">
                    <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-yellow transition-all duration-75 ease-linear"
                        style={{ width: `${stepProgresses[index]}%` }}
                      />
                    </div>
                    <span className="absolute right-0 top-3 text-xs text-gray-500">
                      {Math.round(stepProgresses[index])}%
                    </span>
                  </div>
                )}

                {state === 'completed' && (
                  <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full" />
                  </div>
                )}

                {state === 'pending' && (
                  <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
                    <div className="h-full bg-gray-700 w-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
