import { type Accessor, createSignal } from "solid-js";

type Processing = [
  isProcessing: Accessor<boolean>,
  startProcessing: <T>(fn: () => T | Promise<T>) => Promise<T>,
];

export const createProcessing = (): Processing => {
  const [isProcessing, setIsProcessing] = createSignal(false);

  const startProcessing = async <T>(fn: () => T | Promise<T>): Promise<T> => {
    setIsProcessing(true);
    try {
      return await fn();
    } finally {
      setIsProcessing(false);
    }
  };

  return [isProcessing, startProcessing];
};
