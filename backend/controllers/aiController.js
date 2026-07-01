const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to generate mock scanned phone box data
const getMockPhoneData = () => {
  const mockPhones = [
    { brand: 'Apple', model: 'iPhone 15 Pro', variant: 'Pro', ram: '8GB', storage: '128GB', color: 'Natural Titanium' },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', variant: 'Ultra', ram: '12GB', storage: '256GB', color: 'Titanium Gray' },
    { brand: 'Google', model: 'Pixel 8 Pro', variant: 'Pro', ram: '12GB', storage: '128GB', color: 'Bay Blue' },
    { brand: 'OnePlus', model: '12', variant: 'Base', ram: '16GB', storage: '512GB', color: 'Silky Black' },
    { brand: 'Xiaomi', model: 'Redmi Note 13 Pro', variant: 'Pro', ram: '8GB', storage: '256GB', color: 'Midnight Black' }
  ];
  return mockPhones[Math.floor(Math.random() * mockPhones.length)];
};

// @desc    Scan mobile phone box photo using Gemini Vision API
// @route   POST /api/ai/scan
// @access  Private
const scanPhoneBox = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a photo of the phone box' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // If API key is empty or standard default placeholder, fall back to mock data
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
      console.log('No GEMINI_API_KEY found. Falling back to Mock Scanned Phone Data.');
      // Simulate delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockResult = getMockPhoneData();
      return res.status(200).json({
        success: true,
        isMock: true,
        data: mockResult
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format the image buffer for Gemini
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      }
    };

    const prompt = `You are looking at a photo of a mobile phone retail box.
Extract the following fields and return ONLY valid JSON, no other text:
{
  "brand": string,
  "model": string,
  "variant": string or null,
  "ram": string or null (e.g. "8GB"),
  "storage": string or null (e.g. "128GB"),
  "color": string or null
}
If a field isn't visible or you are not confident, set it to null.`;

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API raw response:', text);

    // Parse and clean JSON response
    let cleanText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini output as JSON:', cleanText);
      // Attempt manual extraction or return fallback mock to be defensive
      return res.status(200).json({
        success: false,
        message: 'AI returned invalid formatting, please enter manually',
        data: {
          brand: '',
          model: '',
          variant: null,
          ram: null,
          storage: null,
          color: null
        }
      });
    }

    res.status(200).json({
      success: true,
      isMock: false,
      data: parsedData
    });

  } catch (error) {
    console.error('Gemini Scanning Error:', error.message);
    res.status(500).json({ message: 'Failed to process image scan: ' + error.message });
  }
};

module.exports = {
  scanPhoneBox
};
