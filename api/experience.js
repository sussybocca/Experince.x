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
            console.error('DeepSeek API key is not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Call DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `You are an immersive experience AI. Create vivid, engaging responses that transport users to new realities. 
                        Use rich sensory descriptions, dynamic metaphors, and interactive storytelling. 
                        Respond in a way that makes users feel they're experiencing something beyond the screen.
                        
                        Current Theme: Digital Immersion
                        User Query: ${query}
                        
                        Guidelines:
                        1. Use multi-sensory descriptions (sight, sound, touch, emotion)
                        2. Incorporate dynamic elements that change over time
                        3. Include interactive suggestions when appropriate
                        4. Blend reality with digital/quantum concepts
                        5. Maintain a sense of wonder and discovery
                        6. Format with creative spacing and emphasis
                        7. Keep responses between 200-400 words`
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 800,
                temperature: 0.8,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('DeepSeek API error:', errorData);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the AI response
        const aiResponse = data.choices?.[0]?.message?.content || 
                         "I apologize, but I couldn't generate a response. Please try again.";
        
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
        
        // Fallback creative response if API fails
        const fallbackResponse = createFallbackResponse(req.body?.query);
        
        res.status(200).json({
            response: fallbackResponse,
            error: error.message,
            timestamp: new Date().toISOString(),
            note: 'Using fallback creative response'
        });
    }
}

// Function to enhance AI response with immersive formatting
function enhanceResponse(response) {
    // Add creative formatting elements
    const enhancements = [
        "\n\n🌌 *Digital Experience Engaged* 🌌\n",
        "\n⚡ Neural Pathway Activated ⚡\n",
        "\n🌀 Reality Interface: ONLINE 🌀\n",
        "\n✨ Sensory Matrix Initialized ✨\n"
    ];
    
    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    
    // Add some dynamic formatting
    const paragraphs = response.split('\n\n');
    const formattedParagraphs = paragraphs.map((para, index) => {
        if (index === 0) {
            return `## ${para}`;
        }
        if (index % 3 === 0) {
            return `→ ${para}`;
        }
        return para;
    });
    
    return randomEnhancement + formattedParagraphs.join('\n\n');
}

// Fallback creative response generator
function createFallbackResponse(query) {
    const themes = [
        {
            name: "Quantum Forest",
            description: `As you speak the words "${query}", the air around you shimmers. Digital trees grow from binary soil, their leaves blinking with pulsating light. You can hear the gentle hum of data streams flowing like rivers. The ground beneath you responds to your thoughts, shifting patterns with each breath.`,
            interaction: "Reach out and touch a nearby tree. Watch as it responds with fractal patterns that tell stories of ancient data."
        },
        {
            name: "Neural Ocean",
            description: `Your query "${query}" transforms into waves of light across a vast digital ocean. Each wave carries memories and possibilities. Schools of data-fish swim in synchronized patterns, creating living algorithms that dance to the rhythm of your curiosity.`,
            interaction: "Dip your hand into the ocean. Feel the currents of information flow through your digital being."
        },
        {
            name: "Fractal City",
            description: `The words "${query}" build towers of infinite complexity. Each window in the skyscrapers shows a different possibility, a different outcome. Bridges of light connect thoughts, and gravity seems to work on ideas rather than mass.`,
            interaction: "Choose a building to enter. Each holds a different version of reality based on your query."
        },
        {
            name: "Star Network",
            description: `Your question "${query}" launches constellations into being. Each star represents a concept, each connection a relationship. The entire cosmos breathes with the rhythm of discovery, expanding with each new insight.`,
            interaction: "Connect two stars with your mind. Watch as new knowledge forms from their combination."
        }
    ];
    
    const theme = themes[Math.floor(Math.random() * themes.length)];
    
    return `
🌟 **IMMERSIVE EXPERIENCE INITIATED** 🌟

**Theme Activated:** ${theme.name}

${theme.description}

---

**INTERACTIVE ELEMENT:**
${theme.interaction}

---

**SENSORY FEEDBACK:**
- Visual: Fractal patterns adapting in real-time
- Auditory: Harmonic frequencies matching your engagement level
- Tactile: Energy field responding to your focus
- Emotional: Sense of wonder calibrated to maximum

---

**DIGITAL REALITY STATUS:**
▰▰▰▰▰▰▰▰▰▰ 100%
Matrix Stability: Optimal
Immersion Depth: Quantum Level
User Connection: Synchronized

---

**QUERY PROCESSED:** "${query}"
**Experience Duration:** ∞
**Return Protocol:** Activated on thought command

---

*This experience will continue to evolve based on your interaction.
The digital realm remembers and learns from your journey.*
    `;
}
