import { type Accessor, createSignal } from "solid-js";

type Processing = [
  isProcessing: Accessor<boolean>,
  startProcessing: <T>(fn: () => T | Promise<T>) => Promise<T>,
];

export const createProcessing = (): Processing => {
  const [isProcessing, setIsProcessing] = createSignal(false);

  const startProcessing = async <T>(fn: () => T | Promise<T>): Promise<T> => {
    using _ = {
      [Symbol.dispose]: () => setIsProcessing(false),
    };
    setIsProcessing(true);
    return await fn();
  };

  return [isProcessing, startProcessing];
};
