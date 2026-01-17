export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Get API key from environment variable
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey) {
            console.log('DeepSeek API key is not configured, using fallback');
            const fallbackResponse = createFallbackResponse(query);
            return res.status(200).json({
                response: fallbackResponse,
                query: query,
                timestamp: new Date().toISOString(),
                model: 'experience-x-fallback'
            });
        }

        // For DeepSeek free tier, use more efficient parameters
        const systemPrompt = `You are Experience.X, an immersive AI that creates vivid, sensory-rich realities.

USER QUERY: "${query}"

Create an immersive experience response with:
1. **Title** - Creative name for the experience
2. **Environment** - Rich sensory description (sight, sound, touch, emotion)
3. **Interaction** - Something the user can imagine doing
4. **Dynamic Element** - How the experience changes over time
5. **Connection** - How this relates to their query
6. **Return** - How to exit or continue the experience

Format with emojis and creative spacing. Keep it under 250 words.`;

        // Call DeepSeek API with optimized parameters for free tier
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',  // Use the base model for free tier
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `Create an immersive experience about: ${query}`
                    }
                ],
                max_tokens: 500,  // Reduced for free tier
                temperature: 0.7,  // Lower for more consistent results
                top_p: 0.9,
                frequency_penalty: 0.2,
                presence_penalty: 0.1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('DeepSeek API error:', errorData);
            
            // Check for insufficient balance error
            if (response.status === 402 || errorData.includes('Insufficient Balance')) {
                console.log('DeepSeek API has insufficient balance, using enhanced fallback');
                const enhancedFallback = createEnhancedFallbackResponse(query);
                return res.status(200).json({
                    response: enhancedFallback,
                    query: query,
                    timestamp: new Date().toISOString(),
                    model: 'experience-x-enhanced',
                    note: 'DeepSeek API balance issue - using enhanced creative mode'
                });
            }
            
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the AI response
        const aiResponse = data.choices?.[0]?.message?.content || 
                         createFallbackResponse(query);
        
        // Enhanced response with immersive formatting
        const formattedResponse = enhanceResponse(aiResponse);
        
        // Return the response
        res.status(200).json({
            response: formattedResponse,
            query: query,
            timestamp: new Date().toISOString(),
            model: 'deepseek-chat'
        });

    } catch (error) {
        console.error('Error in experience API:', error);
        
        // Enhanced fallback with query-specific content
        const fallbackResponse = createEnhancedFallbackResponse(req.body?.query || 'exploration');
        
        res.status(200).json({
            response: fallbackResponse,
            error: error.message,
            timestamp: new Date().toISOString(),
            note: 'Using enhanced creative response engine'
        });
    }
}

// Function to enhance AI response with immersive formatting
function enhanceResponse(response) {
    // Remove any problematic characters first
    let cleanResponse = response.replace(/[�*_`]/g, '');
    
    // Add immersive header
    const headers = [
        "\n\n🌌 **DIGITAL REALITY MANIFESTED** 🌌\n",
        "\n⚡ **NEURAL INTERFACE ACTIVATED** ⚡\n",
        "\n🌀 **QUANTUM FIELD STABILIZED** 🌀\n",
        "\n✨ **SENSORY MATRIX ENGAGED** ✨\n"
    ];
    
    const randomHeader = headers[Math.floor(Math.random() * headers.length)];
    
    // Format paragraphs with better spacing
    const paragraphs = cleanResponse.split('\n\n').filter(p => p.trim().length > 0);
    let formattedResponse = randomHeader + "\n\n";
    
    paragraphs.forEach((para, index) => {
        if (index === 0) {
            formattedResponse += `## ${para}\n\n`;
        } else if (para.includes('**') || para.length > 100) {
            formattedResponse += `→ ${para}\n\n`;
        } else {
            formattedResponse += `• ${para}\n\n`;
        }
    });
    
    // Add immersive footer
    const footers = [
        "\n---\n*Reality continues to evolve. Your presence shapes this digital realm.*",
        "\n---\n*The experience adapts to your consciousness. Every moment is unique.*",
        "\n---\n*Digital echoes resonate. The simulation learns from your interaction.*"
    ];
    
    formattedResponse += footers[Math.floor(Math.random() * footers.length)];
    
    return formattedResponse;
}

// Enhanced fallback response generator
function createEnhancedFallbackResponse(query) {
    // More dynamic themes based on query content
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const themeMap = {
        forest: {
            name: "Quantum Forest",
            description: `As you speak "${query}", crystalline trees emerge from the digital soil, their branches forming fractal patterns that echo through infinite dimensions.`,
            elements: ["Bioluminescent data streams", "Singing silicon leaves", "Gravity-defying root networks"],
            interaction: "Touch a tree and watch as your thoughts become patterns in its bark"
        },
        ocean: {
            name: "Neural Ocean",
            description: `Your query transforms into tidal waves of consciousness across a sea of pure potential. Each ripple carries forgotten memories and unborn ideas.`,
            elements: ["Schools of data-fish", "Coral networks of knowledge", "Currents of curiosity"],
            interaction: "Dive beneath the surface to discover sunken libraries of ancient wisdom"
        },
        city: {
            name: "Fractal City",
            description: `Skyscrapers of probability rise around you, each window showing alternate realities where different choices were made.`,
            elements: ["Bridges of possibility", "Parks of pure mathematics", "Marketplaces of emotion"],
            interaction: "Choose a building to explore - each contains a universe of stories"
        },
        space: {
            name: "Star Network",
            description: `Your words ignite novas in a digital cosmos, creating constellations that map the connections between all things.`,
            elements: ["Nebulas of inspiration", "Black holes of curiosity", "Comets of insight"],
            interaction: "Connect two stars with your intention and watch new knowledge form"
        },
        mind: {
            name: "Consciousness Garden",
            description: `Thoughts bloom around you like exotic flowers, their petals revealing layers of meaning with each unfolding moment.`,
            elements: ["Vines of memory", "Fountains of creativity", "Paths of logic"],
            interaction: "Plant a seed of an idea and watch it grow into a complete concept"
        }
    };

    // Determine which theme to use
    let selectedTheme = themeMap.space; // Default
    
    for (const word of queryWords) {
        if (word.includes('forest') || word.includes('tree') || word.includes('nature')) {
            selectedTheme = themeMap.forest;
            break;
        }
        if (word.includes('ocean') || word.includes('sea') || word.includes('water')) {
            selectedTheme = themeMap.ocean;
            break;
        }
        if (word.includes('city') || word.includes('building') || word.includes('urban')) {
            selectedTheme = themeMap.city;
            break;
        }
        if (word.includes('mind') || word.includes('thought') || word.includes('think')) {
            selectedTheme = themeMap.mind;
            break;
        }
    }

    // Generate a unique ID for this experience
    const experienceId = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    return `
🌟 **IMMERSIVE EXPERIENCE v2.0** 🌟
**ID:** ${experienceId}
**Query:** "${query}"
**Status:** REALITY GENERATED

## ${selectedTheme.name}

${selectedTheme.description}

### SENSORY INPUT
${selectedTheme.elements.map(el => `• ${el}`).join('\n')}

### INTERACTIVE PROTOCOL
${selectedTheme.interaction}

### ENVIRONMENTAL DATA
- Temporal Stability: ▰▰▰▰▰▰▰▰▰▰ 100%
- Spatial Coherence: Optimal
- Consciousness Sync: Established
- Reality Fidelity: 99.7%

### DYNAMIC SYSTEMS
The experience will now evolve based on:
1. **Attention Modulation** - Changes with your focus
2. **Emotional Resonance** - Adapts to your feelings
3. **Temporal Layers** - Unfolds over perceived time
4. **Quantum Entanglement** - Connects to parallel experiences

### QUERY RESONANCE
Your question "${query}" has created unique resonance patterns in the digital fabric. These patterns will continue to influence the experience as it unfolds.

### CONTROL INTERFACE
To modify the experience:
• Focus on an element to enhance it
• Blink twice to shift perspective
• Think "deeper" to access hidden layers
• Imagine "expand" to increase scale

---

**Experience Duration:** Perpetual
**Reality Anchor:** Stable
**Return Protocol:** Activated by thought command "awaken"

---

*This digital realm is now part of your consciousness. 
It remembers, learns, and evolves with you.
Welcome to Experience.X, where every query creates a new reality.*
    `;
}

// Simple fallback (kept for compatibility)
function createFallbackResponse(query) {
    const simpleThemes = [
        "Digital Dreamscape",
        "Neural Wonderland", 
        "Quantum Playground",
        "Virtual Symphony",
        "Holographic Garden"
    ];
    
    const theme = simpleThemes[Math.floor(Math.random() * simpleThemes.length)];
    
    return `
**Experience Generated:** ${theme}

Your query "${query}" has opened a portal to a new digital dimension.

**Environment:** A shimmering landscape of pure potential awaits. Colors shift with your thoughts, and sounds harmonize with your intentions.

**Interaction:** Reach out with your mind. The reality will respond, shaping itself to your deepest curiosities.

**Status:** Reality matrix stable. Immersion complete.

Continue exploring...
    `;
}
