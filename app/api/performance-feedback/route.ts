import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface FeedbackData {
  predictionId: string;
  userId: string;
  predicted: {
    thrust: number;
    flightTime: number;
    topSpeed: number;
    powerConsumption: number;
    thrustToWeight: number;
    totalWeight: number;
  };
  actual: {
    actualFlightTime: number;
    actualTopSpeed: number;
    actualThrustToWeight: number;
    batteryUsage: number;
    overallSatisfaction: number;
    comments: string;
  };
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const feedback: FeedbackData = await request.json();

    // Validate required fields
    if (!feedback.predictionId || !feedback.actual.overallSatisfaction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store feedback in database
    const savedFeedback = await prisma.performanceFeedback.create({
      data: {
        predictionId: feedback.predictionId,
        userId: session.user.email,
        
        // Predicted values
        predictedThrust: feedback.predicted.thrust,
        predictedFlightTime: feedback.predicted.flightTime,
        predictedTopSpeed: feedback.predicted.topSpeed,
        predictedPowerConsumption: feedback.predicted.powerConsumption,
        predictedThrustToWeight: feedback.predicted.thrustToWeight,
        predictedTotalWeight: feedback.predicted.totalWeight,
        
        // Actual values
        actualFlightTime: feedback.actual.actualFlightTime,
        actualTopSpeed: feedback.actual.actualTopSpeed,
        actualThrustToWeight: feedback.actual.actualThrustToWeight,
        batteryUsage: feedback.actual.batteryUsage,
        overallSatisfaction: feedback.actual.overallSatisfaction,
        comments: feedback.actual.comments || null,
        
        createdAt: new Date(feedback.timestamp),
      },
    });

    // Calculate accuracy metrics for immediate response
    const accuracyMetrics = calculateAccuracyMetrics(feedback.predicted, feedback.actual);

    return NextResponse.json({
      success: true,
      feedbackId: savedFeedback.id,
      accuracyMetrics,
      message: 'Feedback received successfully'
    });

  } catch (error) {
    console.error('Performance feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const predictionId = url.searchParams.get('predictionId');

    let whereClause = {};
    
    if (predictionId) {
      whereClause = { predictionId };
    }

    const feedback = await prisma.performanceFeedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent feedback
    });

    // Calculate aggregate statistics
    const stats = calculateAggregateStats(feedback);

    return NextResponse.json({
      feedback,
      stats,
      count: feedback.length
    });

  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}

function calculateAccuracyMetrics(predicted: FeedbackData['predicted'], actual: FeedbackData['actual']) {
  const metrics = [];

  if (actual.actualFlightTime > 0) {
    const flightTimeAccuracy = 1 - Math.abs(predicted.flightTime - actual.actualFlightTime) / predicted.flightTime;
    metrics.push({
      metric: 'flightTime',
      accuracy: Math.max(0, Math.min(1, flightTimeAccuracy)),
      predicted: predicted.flightTime,
      actual: actual.actualFlightTime
    });
  }

  if (actual.actualTopSpeed > 0) {
    const speedAccuracy = 1 - Math.abs(predicted.topSpeed - actual.actualTopSpeed) / predicted.topSpeed;
    metrics.push({
      metric: 'topSpeed',
      accuracy: Math.max(0, Math.min(1, speedAccuracy)),
      predicted: predicted.topSpeed,
      actual: actual.actualTopSpeed
    });
  }

  return metrics;
}

function calculateAggregateStats(feedbackData: Array<{
  overallSatisfaction: number;
  actualFlightTime: number | null;
  actualTopSpeed: number | null;
  predictedFlightTime: number;
  predictedTopSpeed: number;
}>) {
  if (feedbackData.length === 0) return null;

  const satisfactionSum = feedbackData.reduce((sum, f) => sum + f.overallSatisfaction, 0);
  const avgSatisfaction = satisfactionSum / feedbackData.length;

  const flightTimeErrors = feedbackData
    .filter(f => f.actualFlightTime !== null && f.actualFlightTime > 0)
    .map(f => Math.abs(f.predictedFlightTime - f.actualFlightTime!) / f.predictedFlightTime);
  
  const speedErrors = feedbackData
    .filter(f => f.actualTopSpeed !== null && f.actualTopSpeed > 0)
    .map(f => Math.abs(f.predictedTopSpeed - f.actualTopSpeed!) / f.predictedTopSpeed);

  return {
    averageSatisfaction: Math.round(avgSatisfaction * 100) / 100,
    totalFeedback: feedbackData.length,
    flightTimeAccuracy: flightTimeErrors.length > 0 ? 
      1 - (flightTimeErrors.reduce((a, b) => a + b, 0) / flightTimeErrors.length) : null,
    speedAccuracy: speedErrors.length > 0 ? 
      1 - (speedErrors.reduce((a, b) => a + b, 0) / speedErrors.length) : null,
  };
}