import { GoogleGenAI } from '@google/genai'

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const { sessions, profile } = await request.json()

    if (!sessions || sessions.length === 0) {
      return Response.json(
        { error: 'No workout data provided. Log some workouts first!' },
        { status: 400 }
      )
    }

    // Build a concise summary of workout history for the model
    const sessionSummaries = sessions
      .filter(s => s.completed)
      .slice(-20) // Last 20 sessions max to stay within context
      .map(s => {
        let totalVol = 0
        let totalSets = 0
        const exerciseSummary = (s.exercises || []).map(ex => {
          const doneSets = (ex.sets || []).filter(set => set.done)
          const maxWeight = Math.max(...doneSets.map(set => parseFloat(set.weight) || 0), 0)
          const avgReps = doneSets.length > 0
            ? Math.round(doneSets.reduce((sum, set) => sum + (parseInt(set.reps) || 0), 0) / doneSets.length)
            : 0
          doneSets.forEach(set => {
            totalVol += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
            totalSets++
          })
          return `${ex.name}: ${doneSets.length} sets, max ${maxWeight}kg, avg ${avgReps} reps`
        }).join('\n    ')

        return `  Date: ${s.date} | ${s.dayName} (${s.dayLabel})
    Total Volume: ${Math.round(totalVol)}kg | Sets: ${totalSets}
    ${exerciseSummary}`
      }).join('\n\n')

    const profileContext = profile
      ? `User Profile: ${profile.name || 'Unknown'}, Age: ${profile.age || '?'}, Weight: ${profile.weight || '?'}kg, Height: ${profile.height || '?'}cm, Goal: ${profile.goal || 'General Fitness'}`
      : 'No profile data available.'

    const systemPrompt = `You are an expert personal trainer and sports scientist analyzing a user's workout history. Be concise, actionable, and encouraging.

${profileContext}

Workout History (most recent ${sessions.filter(s => s.completed).length} sessions):
${sessionSummaries}

Analyze this data and provide insights in the following structure. Use markdown formatting:

## 📊 Volume Trend
Brief analysis of their total volume over time. Are they progressing? Plateauing?

## 💪 Progressive Overload Check
Are they consistently increasing weight or reps? Which exercises show the most/least progress?

## ⚖️ Muscle Balance
Are any muscle groups being neglected? Is the split balanced?

## 🔄 Recovery & Frequency
Any signs of overtraining or insufficient rest? Recommendations on workout frequency.

## 🎯 Top 3 Action Items
Three specific, actionable recommendations to improve their training.

Keep the entire response under 400 words. Be direct and skip fluff.`

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemma-3-12b-it',
      contents: systemPrompt,
    })

    const text = response.text || ''

    return Response.json({ insights: text })
  } catch (err) {
    console.error('AI Insights Error:', err)
    
    // Handle specific API errors
    if (err.message?.includes('API key')) {
      return Response.json(
        { error: 'Invalid API key. Please check your GEMINI_API_KEY.' },
        { status: 401 }
      )
    }
    
    return Response.json(
      { error: 'Failed to generate insights. Please try again.' },
      { status: 500 }
    )
  }
}
