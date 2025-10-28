// /app/api/health/route.ts
import { NextResponse } from "next/server";
import { getSessionStats } from "@/lib/storage/fileStorage";
import { aiCircuitBreaker } from "@/lib/utils/aiRetry";
import { getRateLimitStats } from "@/lib/middleware/rateLimit";

export async function GET() {
  try {
    const stats = await getSessionStats();
    const circuitBreakerState = aiCircuitBreaker.getState();
    const rateLimitStats = getRateLimitStats();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      sessions: stats,
      aiService: {
        circuitBreaker: circuitBreakerState.state,
        failures: circuitBreakerState.failures,
        lastFailure: circuitBreakerState.lastFailureTime
          ? new Date(circuitBreakerState.lastFailureTime).toISOString()
          : null,
      },
      rateLimit: rateLimitStats,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

