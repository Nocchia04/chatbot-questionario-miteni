// /lib/utils/aiRetry.ts

export type RetryOptions = {
  maxRetries?: number;
  baseDelay?: number; // millisecondi
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
};

/**
 * Esegue una funzione asincrona con retry exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Se è l'ultimo tentativo, lancia l'errore
      if (attempt === maxRetries) {
        break;
      }

      // Calcola delay con exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      console.warn(
        `⚠️ Tentativo ${attempt + 1}/${maxRetries + 1} fallito. Retry tra ${delay}ms...`,
        error.message
      );

      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Aspetta prima del prossimo tentativo
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker semplice per proteggere da fallimenti ripetuti
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minuto
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        // Prova a passare in HALF_OPEN
        this.state = "HALF_OPEN";
        console.log("🔄 Circuit breaker in HALF_OPEN, tentativo di recovery...");
      } else {
        throw new Error(
          "Circuit breaker è OPEN. Il servizio AI è temporaneamente non disponibile."
        );
      }
    }

    try {
      const result = await fn();

      // Se siamo in HALF_OPEN e ha funzionato, torna CLOSED
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failures = 0;
        console.log("✅ Circuit breaker tornato CLOSED");
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = "OPEN";
        console.error(
          `🚨 Circuit breaker OPEN dopo ${this.failures} fallimenti consecutivi`
        );
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = "CLOSED";
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// Istanza globale del circuit breaker per AI calls
export const aiCircuitBreaker = new CircuitBreaker(5, 60000);

