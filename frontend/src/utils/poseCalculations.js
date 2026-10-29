/**
 * Calculates ergonomic posture metrics from MediaPipe Pose landmarks
 */

export function calculatePostureMetrics(landmarks, baseline = null) {
  if (!landmarks || landmarks.length < 13) {
    return {
      isValid: false,
      status: 'No person detected',
      score: 0,
      neckAngle: 0,
      shoulderTilt: 0,
      isSlouching: false,
      reasons: ['Please sit in front of the camera']
    };
  }

  // Key landmarks
  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  // Check landmark visibility/confidence
  const minConfidence = 0.5;
  const isUpperBodyVisible = 
    (leftShoulder.visibility > minConfidence || rightShoulder.visibility > minConfidence) &&
    (leftEar.visibility > minConfidence || rightEar.visibility > minConfidence || nose.visibility > minConfidence);

  if (!isUpperBodyVisible) {
    return {
      isValid: false,
      status: 'Partial visibility',
      score: 50,
      neckAngle: 0,
      shoulderTilt: 0,
      isSlouching: false,
      reasons: ['Adjust camera to show head and shoulders']
    };
  }

  // 1. Calculate midpoints
  const earMid = {
    x: (leftEar.x + rightEar.x) / 2,
    y: (leftEar.y + rightEar.y) / 2
  };
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };

  // 2. Neck angle (forward head tilt / lateral head tilt relative to vertical)
  const dx = Math.abs(earMid.x - shoulderMid.x);
  const dy = Math.abs(shoulderMid.y - earMid.y);
  // Angle in degrees from vertical
  const rawNeckAngle = Math.atan2(dx, dy) * (180 / Math.PI);

  // 3. Shoulder tilt (lateral slope)
  const sDx = rightShoulder.x - leftShoulder.x;
  const sDy = rightShoulder.y - leftShoulder.y;
  const rawShoulderTilt = Math.abs(Math.atan2(sDy, sDx) * (180 / Math.PI));

  // 4. Shoulder width (proxy for proximity / hunching into screen)
  const shoulderWidth = Math.hypot(sDx, sDy);

  // 5. Compare with baseline if calibrated
  let neckAngleDelta = rawNeckAngle;
  let shoulderTiltDelta = rawShoulderTilt;
  let proximityRatio = 1.0;

  if (baseline) {
    neckAngleDelta = Math.abs(rawNeckAngle - baseline.rawNeckAngle);
    shoulderTiltDelta = Math.abs(rawShoulderTilt - baseline.rawShoulderTilt);
    if (baseline.shoulderWidth > 0) {
      proximityRatio = shoulderWidth / baseline.shoulderWidth;
    }
  }

  // Determine violations
  const reasons = [];
  let isSlouching = false;

  // Thresholds
  const neckThreshold = baseline ? 12 : 22; // Degrees of deviation
  const shoulderTiltThreshold = baseline ? 8 : 10;
  const forwardHunchThreshold = 1.25; // 25% closer to camera

  if (neckAngleDelta > neckThreshold) {
    isSlouching = true;
    reasons.push('Forward head tilt ("tech neck")');
  }

  if (shoulderTiltDelta > shoulderTiltThreshold) {
    isSlouching = true;
    reasons.push('Uneven shoulders / leaning sideways');
  }

  if (proximityRatio > forwardHunchThreshold) {
    isSlouching = true;
    reasons.push('Hunching too close to display');
  }

  // Compute ergonomic health score (0 - 100)
  let scoreDeduction = 0;
  scoreDeduction += Math.min(neckAngleDelta * 2.5, 45);
  scoreDeduction += Math.min(shoulderTiltDelta * 3, 35);
  if (proximityRatio > 1.1) {
    scoreDeduction += Math.min((proximityRatio - 1.1) * 100, 20);
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - scoreDeduction)));

  return {
    isValid: true,
    score,
    isSlouching,
    reasons: reasons.length > 0 ? reasons : ['Optimal ergonomic posture'],
    status: isSlouching ? 'Poor Posture' : 'Good Posture',
    rawNeckAngle: Math.round(rawNeckAngle * 10) / 10,
    rawShoulderTilt: Math.round(rawShoulderTilt * 10) / 10,
    shoulderWidth,
    neckAngleDelta: Math.round(neckAngleDelta * 10) / 10,
    shoulderTiltDelta: Math.round(shoulderTiltDelta * 10) / 10,
    keypoints: {
      nose,
      earMid,
      shoulderMid,
      leftShoulder,
      rightShoulder
    }
  };
}
